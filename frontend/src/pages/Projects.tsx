import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, InputNumber, Select, Tag, Space, message, Popconfirm } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { LABELS } from '../types';
import { ProjectStatus } from '../types';
import type { Project, User } from '../types';
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

const nextStatus: Record<string, string> = {
  [ProjectStatus.DRAFT]: ProjectStatus.SUBMITTED,
  [ProjectStatus.SUBMITTED]: ProjectStatus.VENUE_CONFIRMED,
  [ProjectStatus.VENUE_CONFIRMED]: ProjectStatus.EQUIPMENT_LOCKED,
  [ProjectStatus.EQUIPMENT_LOCKED]: ProjectStatus.IN_PROGRESS,
  [ProjectStatus.IN_PROGRESS]: ProjectStatus.RETURNED,
  [ProjectStatus.RETURNED]: ProjectStatus.SETTLED,
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [brokers, setBrokers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const load = () => {
    api.get('/projects').then((r) => setProjects(r.data));
    api.get('/users/role/broker').then((r) => setBrokers(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      performanceDates: typeof values.performanceDates === 'string' ? values.performanceDates.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      rehearsalPeriod: values.rehearsalPeriod
        ? { start: values.rehearsalPeriod[0].format('YYYY-MM-DD'), end: values.rehearsalPeriod[1].format('YYYY-MM-DD') }
        : undefined,
      stageSpecs: values.stageSpecs || undefined,
      equipmentList: [],
      status: ProjectStatus.DRAFT,
    };
    await api.post('/projects', data);
    message.success('项目已创建');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const advanceStatus = async (id: string, status: string) => {
    await api.put(`/projects/${id}/status`, { status });
    message.success('状态已更新');
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>演出项目</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建项目</Button>
      </div>
      <Table
        size="small"
        dataSource={projects}
        rowKey="id"
        onRow={(r) => ({ onClick: () => navigate(`/projects/${r.id}`), style: { cursor: 'pointer' } })}
        columns={[
          { title: '项目名称', dataIndex: 'name', ellipsis: true },
          { title: '状态', dataIndex: 'status', width: 110, render: (s: string) => <Tag color={statusColor[s]}>{LABELS[s]}</Tag> },
          { title: '演出日期', dataIndex: 'performanceDates', width: 200, render: (v: string[]) => v?.join(', ') || '-' },
          { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
          {
            title: '操作', width: 160, render: (_: any, r: Project) => (
              <Space size={4}>
                {nextStatus[r.status] && (
                  <Popconfirm title={`确认推进到「${LABELS[nextStatus[r.status]]}」？`} onConfirm={() => advanceStatus(r.id, nextStatus[r.status])}>
                    <Button size="small" type="link">推进</Button>
                  </Popconfirm>
                )}
                <Button size="small" type="link" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${r.id}`); }}>详情</Button>
              </Space>
            ),
          },
        ]}
      />
      <Modal title="新建演出项目" open={modalOpen} onOk={handleCreate} onCancel={() => { setModalOpen(false); form.resetFields(); }} width={600}>
        <Form form={form} layout="vertical" className="density-compact">
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="brokerId" label="演出经纪" rules={[{ required: true }]}>
            <Select options={brokers.map((b) => ({ label: `${b.name}（${b.company}）`, value: b.id }))} />
          </Form.Item>
          <Form.Item name="performanceDates" label="演出日期（逗号分隔）">
            <Input placeholder="2025-01-01, 2025-01-02" />
          </Form.Item>
          <Form.Item name="rehearsalPeriod" label="排练时段">
            <DatePicker.RangePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="舞台规格">
            <Input.Group compact>
              <Form.Item name={['stageSpecs', 'width']} noStyle><InputNumber placeholder="宽(m)" style={{ width: '25%' }} /></Form.Item>
              <Form.Item name={['stageSpecs', 'depth']} noStyle><InputNumber placeholder="深(m)" style={{ width: '25%' }} /></Form.Item>
              <Form.Item name={['stageSpecs', 'height']} noStyle><InputNumber placeholder="高(m)" style={{ width: '25%' }} /></Form.Item>
              <Form.Item name={['stageSpecs', 'type']} noStyle><Input placeholder="类型" style={{ width: '25%' }} /></Form.Item>
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

export default ProjectsPage;
