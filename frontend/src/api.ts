import axios from 'axios';

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

export default api;
