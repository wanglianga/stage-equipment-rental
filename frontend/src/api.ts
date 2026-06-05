import axios from 'axios';
import { AddShowRequest } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    config.headers['X-User'] = JSON.parse(user).id;
  }
  return config;
});

export const addShowApi = {
  create: (data: Partial<AddShowRequest>) => api.post<AddShowRequest>('/add-show', data),
  findAll: () => api.get<AddShowRequest[]>('/add-show'),
  findOne: (id: string) => api.get<AddShowRequest>(`/add-show/${id}`),
  findByProject: (projectId: string) => api.get<AddShowRequest[]>(`/add-show/project/${projectId}`),
  performChecks: (id: string) => api.post<AddShowRequest>(`/add-show/${id}/check`),
  confirmAlternative: (id: string, confirmed: boolean, selectedAlternatives?: any[]) =>
    api.post<AddShowRequest>(`/add-show/${id}/confirm-alternative`, { confirmed, selectedAlternatives }),
  approve: (id: string) => api.post<AddShowRequest>(`/add-show/${id}/approve`),
  reject: (id: string, reason: string) => api.post<AddShowRequest>(`/add-show/${id}/reject`, { reason }),
};

export default api;
