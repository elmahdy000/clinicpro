import axios from 'axios';
import { toast } from 'sonner';
import { extractErrorMessage } from './utils';

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
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = `/${getLocale()}/login`;
      } else if (error.response?.status >= 400 && error.response?.status !== 401) {
        const msg = extractErrorMessage(error, '');
        if (msg) {
          toast.error(msg);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
