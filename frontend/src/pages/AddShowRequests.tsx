import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Space, Modal, Form, DatePicker, Select, message, Descriptions, Row, Col, Card, Badge, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { addShowApi } from '../api';
import api from '../api';
import { LABELS, AddShowRequestStatus, CheckItemStatus, ProjectStatus } from '../types';
import type { AddShowRequest, Project, Equipment } from '../types';
import dayjs from 'dayjs';

const statusColor: Record<string, string> = {
  [AddShowRequestStatus.PENDING]: 'default',
  [AddShowRequestStatus.CHECKING]: 'processing',
  [AddShowRequestStatus.APPROVED]: 'blue',
  [AddShowRequestStatus.PARTIAL_APPROVED]: 'orange',
  [AddShowRequestStatus.REJECTED]: 'red',
  [AddShowRequestStatus.CONFIRMED]: 'green',
};

const checkColor: Record<string, string> = {
  [CheckItemStatus.PASS]: 'green',
  [CheckItemStatus.FAIL]: 'red',
  [CheckItemStatus.WARNING]: 'orange',
  [CheckItemStatus.PENDING]: 'default',
};

const AddShowRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AddShowRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AddShowRequest | null>(null);
  const [createForm] = Form.useForm();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectForm] = Form.useForm();

  const load = async () => {
    const [reqRes, projRes, equipRes] = await Promise.all([
      addShowApi.findAll(),
      api.get('/projects'),
      api.get('/equipment'),
    ]);
    setRequests(reqRes.data);
    setProjects(projRes.data.filter((p: Project) => p.status !== ProjectStatus.CANCELLED));
    setEquipment(equipRes.data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const values = await createForm.validateFields();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    await addShowApi.create({
      projectId: values.projectId,
      requestedBy: user.id,
      additionalPerformanceDates: values.additionalDates.map((d: any) => d.format('YYYY-MM-DD')),
      requestedEquipment: values.equipmentList,
      notes: values.notes,
    });
    message.success('加场请求已提交');
    setCreateModalOpen(false);
    createForm.resetFields();
    load();
  };

  const handlePerformChecks = async (id: string) => {
    try {
      await addShowApi.performChecks(id);
      message.success('检查完成');
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || '检查失败');
    }
  };

  const handleConfirmAlternative = async (id: string, confirmed: boolean) => {
    try {
      await addShowApi.confirmAlternative(id, confirmed);
      message.success(confirmed ? '替代方案已确认' : '已拒绝替代方案');
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || '操作失败');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await addShowApi.approve(id);
      message.success('加场已确认生效');
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || '确认失败');
    }
  };

  const handleReject = async () => {
    const values = await rejectForm.validateFields();
    try {
      await addShowApi.reject(selectedRequest!.id, values.reason);
      message.success('已拒绝');
      setRejectModalOpen(false);
      rejectForm.resetFields();
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || '操作失败');
    }
  };

  const viewDetail = (req: AddShowRequest) => {
    setSelectedRequest(req);
    setDetailModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>加场请求管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          申请加场
        </Button>
      </div>

      <Table
        size="small"
        dataSource={requests}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '项目名称', dataIndex: ['project', 'name'], width: 180 },
          {
            title: '加场日期',
            dataIndex: 'additionalPerformanceDates',
            width: 200,
            render: (dates: string[]) => dates?.join(', ') || '-',
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s: string) => <Tag color={statusColor[s]}>{LABELS[s]}</Tag>,
          },
          {
            title: '额外押金',
            dataIndex: 'additionalDeposit',
            width: 100,
            render: (v: number) => v > 0 ? `¥${v.toFixed(2)}` : '-',
          },
          {
            title: '额外租金',
            dataIndex: 'additionalRentalFee',
            width: 100,
            render: (v: number) => v > 0 ? `¥${v.toFixed(2)}` : '-',
          },
          { title: '申请时间', dataIndex: 'createdAt', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          {
            title: '操作',
            width: 280,
            render: (_: any, r: AddShowRequest) => (
              <Space size={4}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)}>查看</Button>
                {r.status === AddShowRequestStatus.PENDING && (
                  <Button size="small" type="primary" onClick={() => handlePerformChecks(r.id)}>执行检查</Button>
                )}
                {r.status === AddShowRequestStatus.PARTIAL_APPROVED && !r.alternativeConfirmed && (
                  <>
                    <Popconfirm title="确认接受替代方案？" onConfirm={() => handleConfirmAlternative(r.id, true)}>
                      <Button size="small" type="primary">接受替代</Button>
                    </Popconfirm>
                    <Popconfirm title="确认拒绝替代方案？" onConfirm={() => handleConfirmAlternative(r.id, false)}>
                      <Button size="small" danger>拒绝替代</Button>
                    </Popconfirm>
                  </>
                )}
                {(r.status === AddShowRequestStatus.APPROVED || (r.status === AddShowRequestStatus.PARTIAL_APPROVED && r.alternativeConfirmed)) && (
                  <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApprove(r.id)}>确认生效</Button>
                )}
                {[AddShowRequestStatus.PENDING, AddShowRequestStatus.CHECKING, AddShowRequestStatus.PARTIAL_APPROVED].includes(r.status) && (
                  <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setSelectedRequest(r); setRejectModalOpen(true); }}>拒绝</Button>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Modal title="申请加场" open={createModalOpen} onOk={handleCreate} onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }} width={600}>
        <Form form={createForm} layout="vertical">
          <Form.Item name="projectId" label="选择项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择要加场的项目"
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>
          <Form.Item name="additionalDates" label="加场日期" rules={[{ required: true, message: '请选择加场日期' }]}>
            <DatePicker.RangePicker multiple format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="equipmentList" label="追加设备（可选）">
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              placeholder="选择需要追加的设备"
              options={equipment.map((e) => ({ label: `${e.name}（${LABELS[e.category]}）可${e.availableQuantity}/${e.totalQuantity}`, value: { equipmentId: e.id, quantity: 1 } }))}
            />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Select mode="tags" placeholder="添加备注（可选）" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="加场请求详情" open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} footer={null} width={800}>
        {selectedRequest && (
          <div>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="项目名称">{selectedRequest.project?.name}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColor[selectedRequest.status]}>{LABELS[selectedRequest.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="加场日期" span={2}>{selectedRequest.additionalPerformanceDates?.join(', ')}</Descriptions.Item>
              <Descriptions.Item label="额外押金">¥{selectedRequest.additionalDeposit?.toFixed(2) || '0.00'}</Descriptions.Item>
              <Descriptions.Item label="额外租金">¥{selectedRequest.additionalRentalFee?.toFixed(2) || '0.00'}</Descriptions.Item>
              {selectedRequest.rejectionReason && (
                <Descriptions.Item label="拒绝原因" span={2}>{selectedRequest.rejectionReason}</Descriptions.Item>
              )}
            </Descriptions>

            {selectedRequest.checkResult && (
              <Card size="small" title="资源检查结果" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Badge status={checkColor[selectedRequest.checkResult.equipmentOccupancy] as any} text="设备占用检查" />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{LABELS[selectedRequest.checkResult.equipmentOccupancy]}</div>
                  </Col>
                  <Col span={6}>
                    <Badge status={checkColor[selectedRequest.checkResult.venueWindow] as any} text="剧院窗口检查" />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{LABELS[selectedRequest.checkResult.venueWindow]}</div>
                  </Col>
                  <Col span={6}>
                    <Badge status={checkColor[selectedRequest.checkResult.technicianAvailability] as any} text="技术人员检查" />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{LABELS[selectedRequest.checkResult.technicianAvailability]}</div>
                  </Col>
                  <Col span={6}>
                    <Badge status={checkColor[selectedRequest.checkResult.depositSupplement] as any} text="押金补充检查" />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{LABELS[selectedRequest.checkResult.depositSupplement]}</div>
                  </Col>
                </Row>
                {selectedRequest.checkResult.details && (
                  <div style={{ marginTop: 12, fontSize: 12 }}>
                    {selectedRequest.checkResult.details.equipmentConflicts && selectedRequest.checkResult.details.equipmentConflicts.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>设备冲突：</strong>
                        <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                          {selectedRequest.checkResult.details.equipmentConflicts.map((c, i) => (
                            <li key={i}>{c.equipmentName} - 与项目「{c.conflictProject}」冲突 ({c.conflictDates.join(', ')})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedRequest.checkResult.details.venueConflicts && selectedRequest.checkResult.details.venueConflicts.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>剧院冲突：</strong>
                        <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                          {selectedRequest.checkResult.details.venueConflicts.map((c, i) => (
                            <li key={i}>{c.date}: {c.reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedRequest.checkResult.details.unavailableTechnicians && selectedRequest.checkResult.details.unavailableTechnicians.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>技术人员问题：</strong>
                        <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                          {selectedRequest.checkResult.details.unavailableTechnicians.map((t, i) => (
                            <li key={i}>{t.name}: {t.reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedRequest.checkResult.details.additionalDeposit && selectedRequest.checkResult.details.additionalDeposit > 0 && (
                      <div>
                        <strong>押金情况：</strong>
                        已缴纳 ¥{selectedRequest.checkResult.details.currentDeposit?.toFixed(2)}，需补交 ¥{selectedRequest.checkResult.details.additionalDeposit.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {selectedRequest.timeAdjustment && (
              <Card size="small" title="时间调整（顺延）" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <strong>排练时段：</strong>
                    <div style={{ color: '#666' }}>{selectedRequest.timeAdjustment.rehearsalPeriod.start} ~ {selectedRequest.timeAdjustment.rehearsalPeriod.end}</div>
                  </Col>
                  <Col span={12}>
                    <strong>出库点验：</strong>
                    <div style={{ color: '#666' }}>{selectedRequest.timeAdjustment.outboundDate}</div>
                  </Col>
                  <Col span={12}>
                    <strong>装台联调：</strong>
                    <div style={{ color: '#666' }}>{selectedRequest.timeAdjustment.setupDate}</div>
                  </Col>
                  <Col span={12}>
                    <strong>归还时间：</strong>
                    <div style={{ color: '#666' }}>{selectedRequest.timeAdjustment.returnDate}</div>
                  </Col>
                </Row>
              </Card>
            )}

            {selectedRequest.approvedEquipment && selectedRequest.approvedEquipment.length > 0 && (
              <Card size="small" title="批准设备清单" style={{ marginBottom: 16 }}>
                <Table
                  size="small"
                  dataSource={selectedRequest.approvedEquipment}
                  rowKey="equipmentId"
                  pagination={false}
                  columns={[
                    { title: '设备ID', dataIndex: 'equipmentId', width: 200 },
                    {
                      title: '设备名称',
                      dataIndex: 'equipmentId',
                      render: (id: string) => equipment.find((e) => e.id === id)?.name || id,
                    },
                    { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
                  ]}
                />
              </Card>
            )}

            {selectedRequest.alternativeEquipments && selectedRequest.alternativeEquipments.length > 0 && (
              <Card size="small" title="替代设备方案" style={{ marginBottom: 16 }}>
                <Table
                  size="small"
                  dataSource={selectedRequest.alternativeEquipments}
                  rowKey="alternativeEquipmentId"
                  pagination={false}
                  columns={[
                    { title: '原设备', dataIndex: 'originalEquipmentName' },
                    { title: '替代设备', dataIndex: 'alternativeEquipmentName' },
                    { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
                    { title: '差价', dataIndex: 'priceDifference', width: 100, align: 'right', render: (v: number) => `${v > 0 ? '+' : ''}¥${v.toFixed(2)}/天` },
                  ]}
                />
              </Card>
            )}

            {selectedRequest.supplierStockList && selectedRequest.supplierStockList.length > 0 && (
              <Card size="small" title="供应商备货清单">
                <Table
                  size="small"
                  dataSource={selectedRequest.supplierStockList}
                  rowKey="equipmentId"
                  pagination={false}
                  columns={[
                    { title: '设备名称', dataIndex: 'equipmentName' },
                    { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
                    { title: '供应商ID', dataIndex: 'supplierId', width: 200 },
                  ]}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal title="拒绝加场请求" open={rejectModalOpen} onOk={handleReject} onCancel={() => setRejectModalOpen(false)}>
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="拒绝原因" rules={[{ required: true, message: '请填写拒绝原因' }]}>
            <textarea rows={4} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d9d9d9' }} placeholder="请说明拒绝原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddShowRequestsPage;
