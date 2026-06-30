'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Decode JWT payload without verifying signature (client-side only). */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/** Seconds until a JWT expires. Returns negative if already expired. */
function secondsUntilExpiry(token: string): number {
  const payload = decodeJwt(token);
  if (!payload?.exp) return -1;
  return payload.exp - Math.floor(Date.now() / 1000);
}

/** Store both tokens and update axios default header. */
function persistTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
}

/** Clear all auth data from storage. */
function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Proactive refresh: refresh token 2 minutes before expiry
const REFRESH_BEFORE_SECONDS = 120;

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('main');

  // Ref to the proactive refresh timer so we can clear it on logout
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Branch persistence ───────────────────────────────────────────────────
  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem('active_branch_id', id);
  };

  // ── Apply user from token + profile ──────────────────────────────────────
  const applyToken = (accessToken: string, profile?: { id: number; email: string; name: string; role: string; clinicId?: number }) => {
    const payload = decodeJwt(accessToken);
    if (!payload) return;

    setToken(accessToken);
    setUser(
      profile
        ? { id: profile.id, email: profile.email, name: profile.name, role: profile.role, clinicId: profile.clinicId ?? payload.clinicId }
        : { id: payload.sub, email: payload.email, name: payload.email, role: payload.role, clinicId: payload.clinicId },
    );
  };

  // ── Proactive token refresh ───────────────────────────────────────────────
  const scheduleRefresh = (accessToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const ttl = secondsUntilExpiry(accessToken);
    if (ttl <= 0) return; // already expired — interceptor will handle it

    const delay = Math.max(0, (ttl - REFRESH_BEFORE_SECONDS) * 1000);

    refreshTimerRef.current = setTimeout(async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return;

      try {
        const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
        persistTokens(data.access_token);
        setToken(data.access_token);
        scheduleRefresh(data.access_token); // reschedule for the new token
      } catch {
        // Refresh failed — the response interceptor in api.ts will handle the
        // next 401, but we clear state proactively here so the UI reacts.
        clearTokens();
        setToken(null);
        setUser(null);
      }
    }, delay);
  };

  // ── Boot: restore session from localStorage ───────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('access_token');

    if (stored && secondsUntilExpiry(stored) > 0) {
      applyToken(stored);

      // Fetch real profile in background
      api.get('/auth/me')
        .then((res) => {
          applyToken(stored, res.data);
        })
        .catch(() => {
          // Token rejected by server — clear and let interceptor handle redirect
          clearTokens();
          setToken(null);
          setUser(null);
        });

      scheduleRefresh(stored);
    } else if (stored) {
      // Token exists but expired — try to refresh immediately
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        api.post('/auth/refresh', { refresh_token: refreshToken })
          .then(({ data }) => {
            persistTokens(data.access_token);
            applyToken(data.access_token);
            scheduleRefresh(data.access_token);
            return api.get('/auth/me');
          })
          .then((res) => {
            const at = localStorage.getItem('access_token')!;
            applyToken(at, res.data);
          })
          .catch(() => {
            clearTokens();
          });
      } else {
        clearTokens();
      }
    }

    const storedBranch = localStorage.getItem('active_branch_id');
    if (storedBranch) setActiveBranchIdState(storedBranch);

    setIsLoading(false);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password }).catch((error: any) => {
      // Handle clinic approval redirect
      const message = error?.response?.data?.message;
      if (message) {
        try {
          const parsed = JSON.parse(message);
          if (parsed.code === 'CLINIC_PENDING_APPROVAL' || parsed.code === 'CLINIC_REJECTED') {
            sessionStorage.setItem('clinicApprovalError', JSON.stringify(parsed));
            const locale = window.location.pathname.split('/')[1] || 'ar';
            window.location.href = `/${locale}/clinic-pending`;
            return { data: null };
          }
        } catch { /* not JSON */ }
      }
      throw error;
    });

    if (!data) return; // redirected to clinic-pending

    persistTokens(data.access_token, data.refresh_token);
    applyToken(data.access_token);
    scheduleRefresh(data.access_token);

    // Fetch real profile name
    try {
      const profile = await api.get('/auth/me');
      applyToken(data.access_token, profile.data);
    } catch { /* non-critical */ }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    clearTokens();
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
