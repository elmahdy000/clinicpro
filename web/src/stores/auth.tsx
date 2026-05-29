'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  clinicId?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('main');

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_branch_id', id);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('access_token');
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(stored);
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, name: payload.name || payload.email, role: payload.role, clinicId: payload.clinicId });
      } catch {
        localStorage.removeItem('access_token');
      }
    }
    
    if (typeof window !== 'undefined') {
      const storedBranch = localStorage.getItem('active_branch_id');
      if (storedBranch) {
        setActiveBranchIdState(storedBranch);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access_token);
    setToken(data.access_token);
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    setUser({ id: payload.sub, email: payload.email, name: payload.name || payload.email, role: payload.role, clinicId: payload.clinicId });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    const locale = window.location.pathname.split('/')[1] || 'en';
    window.location.href = `/${locale}/login`;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, activeBranchId, setActiveBranchId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
