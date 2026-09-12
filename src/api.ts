import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // 401 = session invalid/expired -> logout. 403 = logged in but not allowed
    // (e.g. non-admin) -> stay logged in, show the error instead.
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh');
      localStorage.removeItem('admin_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export function errMsg(e: unknown): string {
  const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (d && typeof d.message === 'string') return d.message;
  if (d && typeof d.error === 'string') return d.error;
  return 'Something went wrong';
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
