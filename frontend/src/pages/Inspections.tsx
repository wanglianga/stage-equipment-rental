import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Tag, message, Descriptions } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { LABELS } from '../types';
import { InspectionType, DamageType } from '../types';
import type { Inspection, Schedule, Equipment } from '../types';
import api from '../api';

const damageColor: Record<string, string> = {
  [DamageType.NORMAL_WEAR]: 'default',
  [DamageType.MISSING]: 'red',
  [DamageType.OVERDUE]: 'orange',
  [DamageType.ONSITE_DAMAGE]: 'volcano',
  [DamageType.SUPPLIER_SHORTAGE]: 'purple',
};

const InspectionsPage = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Inspection | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();

  const load = () => {
    api.get('/inspections').then((r) => setInspections(r.data));
    api.get('/schedules').then((r) => setSchedules(r.data));
    api.get('/equipment').then((r) => setEquipment(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await api.post('/inspections', {
      scheduleId: values.scheduleId,
      type: values.type,
      inspectorId: 'system',
      inspectionDate: new Date().toISOString().slice(0, 10),
      notes: values.notes,
    });
    message.success('点验记录已创建');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const handleAddItem = async () => {
    if (!detail) return;
    const values = await itemForm.validateFields();
    await api.post(`/inspections/${detail.id}/items`, [{
      ...values,
      photoUrls: values.photoUrls ? [values.photoUrls] : [],
    }]);
    message.success('点验项已添加');
    setItemModalOpen(false);
    itemForm.resetFields();
    const refreshed = await api.get(`/inspections/${detail.id}`);
    setDetail(refreshed.data);
  };

  const showDetail = async (id: string) => {
    const res = await api.get(`/inspections/${id}`);
    setDetail(res.data);
    setDetailOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>点验管理</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建点验</Button>
      </div>
      <Table
        size="small"
        dataSource={inspections}
        rowKey="id"
        columns={[
          { title: '类型', dataIndex: 'type', width: 100, render: (t: string) => <Tag color={t === InspectionType.OUTBOUND ? 'blue' : 'orange'}>{LABELS[t]}</Tag> },
          { title: '档期ID', dataIndex: 'scheduleId', width: 180, ellipsis: true },
          { title: '点验日期', dataIndex: 'inspectionDate', width: 110 },
          { title: '备注', dataIndex: 'notes', ellipsis: true },
          {
            title: '操作', width: 80, render: (_: any, r: Inspection) => (
              <Button size="small" type="link" onClick={() => showDetail(r.id)}>详情</Button>
            ),
          },
        ]}
      />

      <Modal title="新建点验" open={modalOpen} onOk={handleCreate} onCancel={() => { setModalOpen(false); form.resetFields(); }} width={500}>
        <Form form={form} layout="vertical" className="density-compact">
          <Form.Item name="scheduleId" label="关联档期" rules={[{ required: true }]}>
            <Select options={schedules.map((s) => ({ label: `${s.id.slice(0, 8)}... (${LABELS[s.status]})`, value: s.id }))} />
          </Form.Item>
          <Form.Item name="type" label="点验类型" rules={[{ required: true }]}>
            <Select options={Object.values(InspectionType).map((t) => ({ label: LABELS[t], value: t }))} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="点验详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={800}>
        {detail && (
          <div>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="类型"><Tag color={detail.type === InspectionType.OUTBOUND ? 'blue' : 'orange'}>{LABELS[detail.type]}</Tag></Descriptions.Item>
              <Descriptions.Item label="日期">{detail.inspectionDate}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detail.notes || '-'}</Descriptions.Item>
            </Descriptions>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>点验项 ({detail.items?.length || 0})</strong>
              <Button size="small" type="primary" onClick={() => setItemModalOpen(true)}>添加点验项</Button>
            </div>
            <Table
              size="small"
              dataSource={detail.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '设备ID', dataIndex: 'equipmentId', width: 160, ellipsis: true },
                { title: '损耗类型', dataIndex: 'damageType', width: 110, render: (t: string) => t ? <Tag color={damageColor[t]}>{LABELS[t]}</Tag> : '-' },
                { title: '描述', dataIndex: 'description', ellipsis: true },
                { title: '扣减金额', dataIndex: 'deductionAmount', width: 90, align: 'right', render: (v: number) => v > 0 ? `¥${v}` : '-' },
                { title: '责任方', dataIndex: 'responsibility', width: 100 },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal title="添加点验项" open={itemModalOpen} onOk={handleAddItem} onCancel={() => { setItemModalOpen(false); itemForm.resetFields(); }} width={500}>
        <Form form={itemForm} layout="vertical" className="density-compact">
          <Form.Item name="equipmentId" label="设备" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={equipment.map((e) => ({ label: `${e.name}（${LABELS[e.category]}）`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="damageType" label="损耗类型">
            <Select allowClear placeholder="正常无损" options={Object.values(DamageType).map((d) => ({ label: LABELS[d], value: d }))} />
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="deductionAmount" label="押金扣减"><InputNumber min={0} style={{ width: '100%' }} addonAfter="元" /></Form.Item>
          <Form.Item name="responsibility" label="责任说明"><Input /></Form.Item>
          <Form.Item name="photoUrls" label="点验照片URL"><Input placeholder="照片URL" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InspectionsPage;
