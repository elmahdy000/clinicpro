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

const forceLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = `/${getLocale()}/login`;
  }
};

// ── Request interceptor — attach Bearer token ─────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token refresh state — prevent concurrent refresh races ────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(newToken: string) {
  refreshQueue.forEach((resolve) => resolve(newToken));
  refreshQueue = [];
}

// ── Response interceptor — handle 401 with auto-refresh ───────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (typeof window === 'undefined') return Promise.reject(error);

    const status = error.response?.status;

    // ── Auto-refresh on 401 ──────────────────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');

      // No refresh token → logout immediately
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint with the refresh token in the body
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const newAccessToken = data.access_token;
        localStorage.setItem('access_token', newAccessToken);

        // Update default header and retry queued requests
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(newAccessToken);

        // Retry the original failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed (expired or revoked) → logout
        processQueue('');
        forceLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Other errors — show toast for 4xx (except 401 handled above) ──────
    if (status && status >= 400 && status !== 401 && status !== 429) {
      const msg = extractErrorMessage(error, '');
      if (msg) toast.error(msg);
    }

    if (status === 429) {
      toast.error(
        getLocale() === 'ar'
          ? 'طلبات كثيرة جداً. الرجاء الانتظار دقيقة ثم المحاولة مرة أخرى.'
          : 'Too many requests. Please wait a moment and try again.',
      );
    }

    return Promise.reject(error);
  },
);

export default api;
