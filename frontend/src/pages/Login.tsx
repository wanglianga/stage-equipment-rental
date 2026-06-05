import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useAuth } from '../store';

const LoginPage = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    const ok = await login(values.username, values.password);
    setLoading(false);
    if (!ok) message.error('用户名或密码错误');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 420 }} title={<div style={{ textAlign: 'center', fontSize: 20, fontWeight: 600 }}>舞台设备租赁系统</div>}>
        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          默认账号：broker1/tech1/supplier1，密码：123456
        </Typography.Text>
      </Card>
    </div>
  );
};

export default LoginPage;
