import { useEffect, useState } from 'react';
import { Table, Button, Modal, Tag, Descriptions, message, Card, Row, Col, Statistic, Popconfirm, Space } from 'antd';
import { LABELS } from '../types';
import { SettlementStatus, DamageType } from '../types';
import type { Settlement, Project, Equipment } from '../types';
import api from '../api';

const statusColor: Record<string, string> = {
  [SettlementStatus.PENDING]: 'default',
  [SettlementStatus.CONFIRMED]: 'blue',
  [SettlementStatus.PAID]: 'green',
  [SettlementStatus.DISPUTED]: 'red',
};

const damageColor: Record<string, string> = {
  [DamageType.NORMAL_WEAR]: 'default',
  [DamageType.MISSING]: 'red',
  [DamageType.OVERDUE]: 'orange',
  [DamageType.ONSITE_DAMAGE]: 'volcano',
  [DamageType.SUPPLIER_SHORTAGE]: 'purple',
};

const SettlementsPage = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<Settlement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const load = () => {
    api.get('/settlements').then((r) => setSettlements(r.data));
    api.get('/projects').then((r) => setProjects(r.data));
    api.get('/equipment').then((r) => setEquipment(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async (projectId: string) => {
    await api.post(`/settlements/project/${projectId}/generate`);
    message.success('结算单已生成');
    load();
  };

  const showDetail = async (id: string) => {
    const res = await api.get(`/settlements/${id}`);
    setDetail(res.data);
    setDetailOpen(true);
  };

  const updateStatus = async (id: string, status: SettlementStatus) => {
    await api.put(`/settlements/${id}/status`, { status });
    message.success('状态已更新');
    load();
    if (detailOpen && detail?.id === id) {
      const res = await api.get(`/settlements/${id}`);
      setDetail(res.data);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>费用结算</h3>
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="结算单数" value={settlements.length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待确认" value={settlements.filter((s) => s.status === SettlementStatus.PENDING).length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总租金" value={settlements.reduce((s, x) => s + x.totalRentalFee, 0)} prefix="¥" precision={2} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总扣减" value={settlements.reduce((s, x) => s + x.totalDeduction, 0)} prefix="¥" precision={2} valueStyle={{ color: settlements.reduce((s, x) => s + x.totalDeduction, 0) > 0 ? '#cf1322' : undefined }} /></Card></Col>
      </Row>

      <Table
        size="small"
        dataSource={settlements}
        rowKey="id"
        columns={[
          { title: '项目ID', dataIndex: 'projectId', width: 180, ellipsis: true },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag color={statusColor[s]}>{LABELS[s]}</Tag> },
          { title: '租金', dataIndex: 'totalRentalFee', width: 100, align: 'right', render: (v: number) => `¥${v.toFixed(2)}` },
          { title: '押金', dataIndex: 'totalDeposit', width: 100, align: 'right', render: (v: number) => `¥${v.toFixed(2)}` },
          { title: '扣减', dataIndex: 'totalDeduction', width: 100, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#cf1322' }}>¥{v.toFixed(2)}</span> : '¥0.00' },
          { title: '应付', dataIndex: 'finalAmount', width: 100, align: 'right', render: (v: number) => <strong>¥{v.toFixed(2)}</strong> },
          {
            title: '操作', width: 200, render: (_: any, r: Settlement) => (
              <Space size={4}>
                <Button size="small" type="link" onClick={() => showDetail(r.id)}>详情</Button>
                {r.status === SettlementStatus.PENDING && (
                  <Popconfirm title="确认结算单？" onConfirm={() => updateStatus(r.id, SettlementStatus.CONFIRMED)}>
                    <Button size="small" type="link">确认</Button>
                  </Popconfirm>
                )}
                {r.status === SettlementStatus.CONFIRMED && (
                  <Popconfirm title="确认已付款？" onConfirm={() => updateStatus(r.id, SettlementStatus.PAID)}>
                    <Button size="small" type="link" style={{ color: 'green' }}>付款</Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <h4>为项目生成结算单</h4>
        <Space wrap>
          {projects.filter((p) => p.status === 'returned').map((p) => (
            <Button key={p.id} size="small" onClick={() => handleGenerate(p.id)}>{p.name}</Button>
          ))}
          {projects.filter((p) => p.status === 'returned').length === 0 && <span style={{ color: '#999' }}>暂无已归还项目</span>}
        </Space>
      </div>

      <Modal title="结算详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={900}>
        {detail && (
          <div>
            <Descriptions size="small" bordered column={3} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="租金合计">¥{detail.totalRentalFee.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="押金合计">¥{detail.totalDeposit.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="扣减合计"><span style={{ color: detail.totalDeduction > 0 ? '#cf1322' : undefined }}>¥{detail.totalDeduction.toFixed(2)}</span></Descriptions.Item>
              <Descriptions.Item label="应付金额"><strong style={{ fontSize: 16 }}>¥{detail.finalAmount.toFixed(2)}</strong></Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColor[detail.status]}>{LABELS[detail.status]}</Tag></Descriptions.Item>
            </Descriptions>
            <h4>明细</h4>
            <Table
              size="small"
              dataSource={detail.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '设备', dataIndex: 'equipmentId', width: 140, ellipsis: true, render: (id: string) => { const e = equipment.find((x) => x.id === id); return e?.name || id.slice(0, 8); } },
                { title: '数量', dataIndex: 'quantity', width: 50, align: 'right' },
                { title: '天数', dataIndex: 'rentalDays', width: 50, align: 'right' },
                { title: '租金', dataIndex: 'rentalFee', width: 80, align: 'right', render: (v: number) => `¥${v.toFixed(2)}` },
                { title: '扣减类型', dataIndex: 'deductionType', width: 110, render: (t: string) => t ? <Tag color={damageColor[t]}>{LABELS[t]}</Tag> : '-' },
                { title: '扣减金额', dataIndex: 'deductionAmount', width: 90, align: 'right', render: (v: number) => v > 0 ? <span style={{ color: '#cf1322' }}>¥{v.toFixed(2)}</span> : '-' },
                { title: '责任方', dataIndex: 'responsibility', width: 80 },
                { title: '点验照片', dataIndex: 'photoUrl', width: 80, render: (v: string) => v ? <a href={v} target="_blank" rel="noreferrer">查看</a> : '-' },
                { title: '点验项ID', dataIndex: 'inspectionItemId', width: 80, render: (v: string) => v ? <span style={{ fontSize: 11 }}>{v.slice(0, 8)}</span> : '-' },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SettlementsPage;
