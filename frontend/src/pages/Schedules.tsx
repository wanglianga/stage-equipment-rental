import { useEffect, useState } from 'react';
import { Tag, Card, Row, Col, Select, Space } from 'antd';
import { LABELS } from '../types';
import { ScheduleStatus, EquipmentCategory } from '../types';
import type { Schedule, Equipment } from '../types';
import api from '../api';

const scheduleColor: Record<string, string> = {
  [ScheduleStatus.REQUESTED]: 'default',
  [ScheduleStatus.LOCKED]: 'blue',
  [ScheduleStatus.OUTBOUND]: 'cyan',
  [ScheduleStatus.SETUP]: 'green',
  [ScheduleStatus.RETURNED]: 'orange',
  [ScheduleStatus.CANCELLED]: 'red',
};

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();

  useEffect(() => {
    api.get('/schedules').then((r) => setSchedules(r.data));
    api.get('/equipment').then((r) => setEquipment(r.data));
  }, []);

  const filtered = schedules.filter((s) => {
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterCategory) {
      const equip = equipment.find((e) => e.id === s.equipmentId);
      if (equip?.category !== filterCategory) return false;
    }
    return true;
  });

  const grouped = Object.values(ScheduleStatus).reduce((acc, status) => {
    acc[status] = filtered.filter((s) => s.status === status);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>档期排期看板</h3>
      <Space style={{ marginBottom: 12 }}>
        <span>状态筛选：</span>
        <Select
          allowClear
          placeholder="全部状态"
          style={{ width: 120 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={Object.values(ScheduleStatus).map((s) => ({ label: LABELS[s], value: s }))}
        />
        <span>设备类别：</span>
        <Select
          allowClear
          placeholder="全部类别"
          style={{ width: 120 }}
          value={filterCategory}
          onChange={setFilterCategory}
          options={Object.values(EquipmentCategory).map((c) => ({ label: LABELS[c], value: c }))}
        />
      </Space>
      <Row gutter={8}>
        {Object.entries(grouped).map(([status, items]) => (
          <Col span={4} key={status}>
            <Card
              size="small"
              title={<Tag color={scheduleColor[status]}>{LABELS[status]}</Tag>}
              style={{ minHeight: 200 }}
              styles={{ body: { padding: 8, maxHeight: 400, overflow: 'auto' } }}
            >
              {items.length === 0 && <div style={{ color: '#ccc', textAlign: 'center', padding: 20 }}>暂无</div>}
              {items.map((s) => {
                const equip = equipment.find((e) => e.id === s.equipmentId);
                return (
                  <Card key={s.id} size="small" style={{ marginBottom: 4, fontSize: 12 }}>
                    <div><strong>{equip?.name || s.equipmentId.slice(0, 8)}</strong></div>
                    <div>{s.startDate} ~ {s.endDate}</div>
                    <div>数量: {s.quantity}</div>
                  </Card>
                );
              })}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SchedulesPage;
