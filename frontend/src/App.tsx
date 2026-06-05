import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './store';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProjectsPage from './pages/Projects';
import ProjectDetailPage from './pages/ProjectDetail';
import EquipmentPage from './pages/Equipment';
import SchedulesPage from './pages/Schedules';
import InspectionsPage from './pages/Inspections';
import SettlementsPage from './pages/Settlements';
import AddShowRequestsPage from './pages/AddShowRequests';
import MainLayout from './components/MainLayout';

const ProtectedRoutes = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/settlements" element={<SettlementsPage />} />
        <Route path="/add-show" element={<AddShowRequestsPage />} />
      </Routes>
    </MainLayout>
  );
};

const App = () => (
  <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff', borderRadius: 4 } }}>
    <AntApp>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AntApp>
  </ConfigProvider>
);

export default App;
