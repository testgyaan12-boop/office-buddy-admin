import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { api } from './api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  accessRole?: string;
}

interface AuthCtx {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, login: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const raw = localStorage.getItem('admin_user');
      return raw ? (JSON.parse(raw) as AdminUser) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    let r;
    try {
      r = await api.post('/auth/login', { email, password });
    } catch (e) {
      const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (d && typeof d.message === 'string' && d.message) throw new Error(d.message);
      if (d && typeof d.error === 'string' && d.error) throw new Error(d.error);
      throw new Error('Login failed. Please try again.');
    }
    const u = r.data.user as AdminUser;
    if ((u.accessRole || '').toLowerCase() !== 'admin') {
      throw new Error('Access denied: admin only');
    }
    localStorage.setItem('admin_token', r.data.accessToken);
    if (r.data.refreshToken) localStorage.setItem('admin_refresh', r.data.refreshToken);
    localStorage.setItem('admin_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
    localStorage.removeItem('admin_user');
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
