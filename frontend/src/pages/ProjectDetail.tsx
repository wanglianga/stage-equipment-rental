import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Tabs, Table, Tag, Button, Space, message, Popconfirm, Form, Input, InputNumber, Select, Modal, DatePicker, Timeline } from 'antd';
import { LABELS } from '../types';
import { ProjectStatus, ScheduleStatus } from '../types';
import type { Project, Schedule, VenueConfirmation, Equipment } from '../types';
import api from '../api';

const statusColor: Record<string, string> = {
  [ProjectStatus.DRAFT]: 'default',
  [ProjectStatus.SUBMITTED]: 'processing',
  [ProjectStatus.VENUE_CONFIRMED]: 'cyan',
  [ProjectStatus.EQUIPMENT_LOCKED]: 'blue',
  [ProjectStatus.IN_PROGRESS]: 'green',
  [ProjectStatus.RETURNED]: 'orange',
  [ProjectStatus.SETTLED]: 'success',
  [ProjectStatus.CANCELLED]: 'red',
};

const scheduleColor: Record<string, string> = {
  [ScheduleStatus.REQUESTED]: 'default',
  [ScheduleStatus.LOCKED]: 'blue',
  [ScheduleStatus.OUTBOUND]: 'cyan',
  [ScheduleStatus.SETUP]: 'green',
  [ScheduleStatus.RETURNED]: 'orange',
  [ScheduleStatus.CANCELLED]: 'red',
};

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [venue, setVenue] = useState<VenueConfirmation | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [scheduleForm] = Form.useForm();
  const [venueForm] = Form.useForm();

  const load = async () => {
    if (!id) return;
    const [projRes, schedRes, venueRes, equipRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/schedules/project/${id}`),
      api.get(`/venue/project/${id}`),
      api.get('/equipment'),
    ]);
    setProject(projRes.data);
    setSchedules(schedRes.data);
    setVenue(venueRes.data[0] || null);
    setEquipment(equipRes.data);
  };

  useEffect(() => { load(); }, [id]);

  if (!project) return <div>加载中...</div>;

  const handleAddSchedule = async () => {
    const values = await scheduleForm.validateFields();
    await api.post('/schedules', { ...values, projectId: id, status: ScheduleStatus.REQUESTED });
    message.success('档期已申请');
    setScheduleModalOpen(false);
    scheduleForm.resetFields();
    load();
  };

  const handleVenueConfirm = async () => {
    const values = await venueForm.validateFields();
    if (venue) {
      await api.put(`/venue/${venue.id}/confirm`, values);
    } else {
      await api.post('/venue', { ...values, projectId: id, confirmed: true });
    }
    message.success('场馆条件已确认');
    setVenueModalOpen(false);
    venueForm.resetFields();
    load();
  };

  const scheduleActions: Record<string, { label: string; action: string; color?: string }[]> = {
    [ScheduleStatus.REQUESTED]: [{ label: '锁定', action: 'lock', color: 'blue' }],
    [ScheduleStatus.LOCKED]: [{ label: '出库', action: 'outbound', color: 'cyan' }],
    [ScheduleStatus.OUTBOUND]: [{ label: '装台', action: 'setup', color: 'green' }],
    [ScheduleStatus.SETUP]: [{ label: '归还', action: 'return', color: 'orange' }],
  };

  return (
    <div>
      <Button type="link" onClick={() => navigate('/projects')} style={{ padding: 0, marginBottom: 8 }}>&lt; 返回项目列表</Button>
      <Descriptions title={project.name} size="small" bordered column={3} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="状态"><Tag color={statusColor[project.status]}>{LABELS[project.status]}</Tag></Descriptions.Item>
        <Descriptions.Item label="演出日期">{project.performanceDates?.join(', ') || '-'}</Descriptions.Item>
        <Descriptions.Item label="排练时段">{project.rehearsalPeriod ? `${project.rehearsalPeriod.start} ~ ${project.rehearsalPeriod.end}` : '-'}</Descriptions.Item>
        <Descriptions.Item label="舞台规格">{project.stageSpecs ? `${project.stageSpecs.width}m×${project.stageSpecs.depth}m×${project.stageSpecs.height}m ${project.stageSpecs.type}` : '-'}</Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>{project.notes || '-'}</Descriptions.Item>
      </Descriptions>

      <Tabs defaultActiveKey="schedules" items={[
        {
          key: 'schedules',
          label: '设备档期',
          children: (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>共 {schedules.length} 条档期</span>
                <Button size="small" type="primary" onClick={() => setScheduleModalOpen(true)}>申请档期</Button>
              </div>
              <Table
                size="small"
                dataSource={schedules}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '设备ID', dataIndex: 'equipmentId', width: 200, ellipsis: true },
                  { title: '数量', dataIndex: 'quantity', width: 60, align: 'right' },
                  { title: '开始', dataIndex: 'startDate', width: 100 },
                  { title: '结束', dataIndex: 'endDate', width: 100 },
                  { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag color={scheduleColor[s]}>{LABELS[s]}</Tag> },
                  {
                    title: '操作', width: 120, render: (_: any, r: Schedule) => (
                      <Space size={4}>
                        {(scheduleActions[r.status] || []).map((a) => (
                          <Popconfirm key={a.action} title={`确认${a.label}？`} onConfirm={async () => {
                            await api.put(`/schedules/${r.id}/${a.action}`);
                            message.success(`${a.label}成功`);
                            load();
                          }}>
                            <Button size="small" type="link" style={{ color: a.color }}>{a.label}</Button>
                          </Popconfirm>
                        ))}
                        {r.status === ScheduleStatus.REQUESTED && (
                          <Popconfirm title="确认取消？" onConfirm={async () => { await api.put(`/schedules/${r.id}/cancel`); message.success('已取消'); load(); }}>
                            <Button size="small" type="link" danger>取消</Button>
                          </Popconfirm>
                        )}
                      </Space>
                    ),
                  },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'venue',
          label: '场馆确认',
          children: (
            <div>
              {venue ? (
                <Descriptions size="small" bordered column={2}>
                  <Descriptions.Item label="装台窗口">{venue.setupWindow ? `${venue.setupWindow.start} ~ ${venue.setupWindow.end}` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="供电条件">{venue.powerConditions ? `${venue.powerConditions.totalKW}kW ${venue.powerConditions.phases}相` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="吊挂点位">{venue.riggingPoints ? `${venue.riggingPoints.count}个 承重${venue.riggingPoints.maxLoad}kg ${venue.riggingPoints.type}` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="确认状态"><Tag color={venue.confirmed ? 'green' : 'default'}>{venue.confirmed ? '已确认' : '待确认'}</Tag></Descriptions.Item>
                  <Descriptions.Item label="场馆限制" span={2}>{venue.restrictions ? JSON.stringify(venue.restrictions) : '-'}</Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>{venue.notes || '-'}</Descriptions.Item>
                </Descriptions>
              ) : (
                <div style={{ color: '#999', marginBottom: 8 }}>暂无场馆确认信息</div>
              )}
              <Button size="small" type="primary" style={{ marginTop: 8 }} onClick={() => { if (venue) { venueForm.setFieldsValue(venue); } setVenueModalOpen(true); }}>
                {venue ? '编辑' : '填写'}场馆条件
              </Button>
            </div>
          ),
        },
        {
          key: 'flow',
          label: '流程追踪',
          children: (
            <Timeline items={[
              { color: project.status !== ProjectStatus.DRAFT ? 'green' : 'gray', children: '档期申请' },
              { color: [ProjectStatus.VENUE_CONFIRMED, ProjectStatus.EQUIPMENT_LOCKED, ProjectStatus.IN_PROGRESS, ProjectStatus.RETURNED, ProjectStatus.SETTLED].includes(project.status) ? 'green' : 'gray', children: '设备锁定' },
              { color: [ProjectStatus.EQUIPMENT_LOCKED, ProjectStatus.IN_PROGRESS, ProjectStatus.RETURNED, ProjectStatus.SETTLED].includes(project.status) ? 'green' : 'gray', children: '出库点验' },
              { color: [ProjectStatus.IN_PROGRESS, ProjectStatus.RETURNED, ProjectStatus.SETTLED].includes(project.status) ? 'green' : 'gray', children: '装台联调' },
              { color: [ProjectStatus.RETURNED, ProjectStatus.SETTLED].includes(project.status) ? 'green' : 'gray', children: '演后归还' },
              { color: [ProjectStatus.RETURNED, ProjectStatus.SETTLED].includes(project.status) ? 'green' : 'gray', children: '损耗确认' },
              { color: project.status === ProjectStatus.SETTLED ? 'green' : 'gray', children: '费用结算' },
            ]} />
          ),
        },
      ]} />

      <Modal title="申请设备档期" open={scheduleModalOpen} onOk={handleAddSchedule} onCancel={() => { setScheduleModalOpen(false); scheduleForm.resetFields(); }} width={500}>
        <Form form={scheduleForm} layout="vertical" className="density-compact">
          <Form.Item name="equipmentId" label="设备" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={equipment.map((e) => ({ label: `${e.name}（${LABELS[e.category]}）可${e.availableQuantity}/${e.totalQuantity}`, value: e.id }))} />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dateRange" label="使用日期" rules={[{ required: true }]}>
            <DatePicker.RangePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="场馆条件确认" open={venueModalOpen} onOk={handleVenueConfirm} onCancel={() => { setVenueModalOpen(false); venueForm.resetFields(); }} width={600}>
        <Form form={venueForm} layout="vertical" className="density-compact">
          <Form.Item label="装台窗口">
            <Input.Group compact>
              <Form.Item name={['setupWindow', 'start']} noStyle><Input placeholder="开始时间" style={{ width: '50%' }} /></Form.Item>
              <Form.Item name={['setupWindow', 'end']} noStyle><Input placeholder="结束时间" style={{ width: '50%' }} /></Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item label="供电条件">
            <Input.Group compact>
              <Form.Item name={['powerConditions', 'totalKW']} noStyle><InputNumber placeholder="总功率kW" style={{ width: '33%' }} /></Form.Item>
              <Form.Item name={['powerConditions', 'phases']} noStyle><InputNumber placeholder="相数" style={{ width: '33%' }} /></Form.Item>
              <Form.Item name={['powerConditions', 'outlets']} noStyle><Input placeholder="接口" style={{ width: '34%' }} /></Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item label="吊挂点位">
            <Input.Group compact>
              <Form.Item name={['riggingPoints', 'count']} noStyle><InputNumber placeholder="数量" style={{ width: '33%' }} /></Form.Item>
              <Form.Item name={['riggingPoints', 'maxLoad']} noStyle><InputNumber placeholder="承重kg" style={{ width: '33%' }} /></Form.Item>
              <Form.Item name={['riggingPoints', 'type']} noStyle><Input placeholder="类型" style={{ width: '34%' }} /></Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
