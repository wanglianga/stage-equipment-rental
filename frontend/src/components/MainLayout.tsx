import { ReactNode } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store';
import { LABELS } from '../types';
import {
  DashboardOutlined,
  ProjectOutlined,
  ToolOutlined,
  CalendarOutlined,
  AuditOutlined,
  DollarOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/projects', icon: <ProjectOutlined />, label: '演出项目' },
  { key: '/equipment', icon: <ToolOutlined />, label: '设备管理' },
  { key: '/schedules', icon: <CalendarOutlined />, label: '档期排期' },
  { key: '/inspections', icon: <AuditOutlined />, label: '点验管理' },
  { key: '/settlements', icon: <DollarOutlined />, label: '费用结算' },
];

const MainLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={180} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 14 }}>
          舞台设备租赁系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0', height: 48, lineHeight: '48px' }}>
          <Dropdown
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.name}</span>
              <span style={{ color: '#999', fontSize: 12 }}>[{LABELS[user?.role || '']}]</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 12, padding: 16, background: '#fff', minHeight: 280, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
