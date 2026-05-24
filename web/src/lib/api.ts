import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const getLocale = () => {
  if (typeof window === 'undefined') return 'en';
  const match = window.location.pathname.match(/^\/(en|ar)/);
  return match?.[1] || 'en';
};

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = `/${getLocale()}/login`;
    }
    return Promise.reject(error);
  },
);

export default api;
