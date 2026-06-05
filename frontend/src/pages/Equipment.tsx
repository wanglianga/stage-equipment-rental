import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, message, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { LABELS } from '../types';
import { EquipmentCategory } from '../types';
import type { Equipment, User } from '../types';
import api from '../api';

const categoryColor: Record<string, string> = {
  [EquipmentCategory.LIGHTING]: 'gold',
  [EquipmentCategory.AUDIO]: 'blue',
  [EquipmentCategory.CONSOLE]: 'purple',
  [EquipmentCategory.CABLE]: 'default',
  [EquipmentCategory.STAND]: 'cyan',
  [EquipmentCategory.CASE]: 'orange',
};

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [suppliers, setSuppliers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    api.get('/equipment').then((r) => setEquipment(r.data));
    api.get('/users/role/supplier').then((r) => setSuppliers(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await api.post('/equipment', { ...values, specs: {}, depositTerms: {} });
    message.success('设备已登记');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const categoryStats = Object.values(EquipmentCategory).map((cat) => ({
    category: cat,
    count: equipment.filter((e) => e.category === cat).length,
    total: equipment.filter((e) => e.category === cat).reduce((s, e) => s + e.totalQuantity, 0),
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>设备管理</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>登记设备</Button>
      </div>
      <Row gutter={8} style={{ marginBottom: 12 }}>
        {categoryStats.map((cs) => (
          <Col span={4} key={cs.category}>
            <Card size="small">
              <Statistic title={<Tag color={categoryColor[cs.category]}>{LABELS[cs.category]}</Tag>} value={cs.count} suffix={`种 / ${cs.total}件`} valueStyle={{ fontSize: 16 }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Table
        size="small"
        dataSource={equipment}
        rowKey="id"
        columns={[
          { title: '设备名称', dataIndex: 'name', width: 160, ellipsis: true },
          { title: '类别', dataIndex: 'category', width: 80, render: (c: string) => <Tag color={categoryColor[c]}>{LABELS[c]}</Tag> },
          { title: '品牌', dataIndex: 'brand', width: 80 },
          { title: '型号', dataIndex: 'model', width: 120 },
          { title: '日租', dataIndex: 'dailyRate', width: 80, align: 'right', render: (v: number) => `¥${v}` },
          { title: '押金', dataIndex: 'deposit', width: 80, align: 'right', render: (v: number) => `¥${v}` },
          { title: '库存', width: 100, render: (_: any, r: Equipment) => <span>{r.availableQuantity}/{r.totalQuantity}</span> },
        ]}
      />
      <Modal title="登记设备" open={modalOpen} onOk={handleCreate} onCancel={() => { setModalOpen(false); form.resetFields(); }} width={600}>
        <Form form={form} layout="vertical" className="density-compact">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="设备名称" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="设备类别" rules={[{ required: true }]}>
                <Select options={Object.values(EquipmentCategory).map((c) => ({ label: LABELS[c], value: c }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="brand" label="品牌"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="model" label="型号"><Input /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}>
                <Select options={suppliers.map((s) => ({ label: s.name, value: s.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="dailyRate" label="日租金" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} addonAfter="元" /></Form.Item></Col>
            <Col span={8}><Form.Item name="deposit" label="押金" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} addonAfter="元" /></Form.Item></Col>
            <Col span={8}><Form.Item name="totalQuantity" label="总数" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} addonAfter="件" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentPage;
