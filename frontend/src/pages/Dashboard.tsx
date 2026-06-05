import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store';
import { LABELS } from '../types';
import { ProjectStatus, ScheduleStatus } from '../types';
import type { Project, Schedule, Equipment } from '../types';
import api from '../api';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (initialized) return;
      await api.post('/users/seed');
      await api.post('/equipment/seed');
      setInitialized(true);
    };
    init();
  }, [initialized]);

  useEffect(() => {
    api.get('/projects').then((r) => setProjects(r.data));
    api.get('/schedules').then((r) => setSchedules(r.data));
    api.get('/equipment').then((r) => setEquipment(r.data));
  }, []);

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

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        工作台 {user && <span style={{ fontWeight: 400, fontSize: 14, color: '#999' }}>- {user.name}（{LABELS[user.role]}）</span>}
      </Typography.Title>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="演出项目" value={projects.length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="进行中" value={projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS).length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="档期锁定" value={schedules.filter((s) => s.status === ScheduleStatus.LOCKED).length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="设备总数" value={equipment.length} /></Card></Col>
      </Row>
      <Row gutter={12}>
        <Col span={14}>
          <Card title="最近项目" size="small" extra={<Button type="link" size="small" onClick={() => navigate('/projects')}>查看全部</Button>}>
            <Table
              size="small"
              pagination={false}
              dataSource={projects.slice(0, 8)}
              rowKey="id"
              columns={[
                { title: '项目名称', dataIndex: 'name', ellipsis: true },
                { title: '状态', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={statusColor[s]}>{LABELS[s]}</Tag> },
                { title: '创建时间', dataIndex: 'createdAt', width: 160, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="档期概览" size="small" extra={<Button type="link" size="small" onClick={() => navigate('/schedules')}>查看全部</Button>}>
            <Table
              size="small"
              pagination={false}
              dataSource={schedules.slice(0, 8)}
              rowKey="id"
              columns={[
                { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag color={scheduleColor[s]}>{LABELS[s]}</Tag> },
                { title: '开始', dataIndex: 'startDate', width: 100 },
                { title: '结束', dataIndex: 'endDate', width: 100 },
                { title: '数量', dataIndex: 'quantity', width: 60, align: 'right' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
