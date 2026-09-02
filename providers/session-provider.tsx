import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  api,
  clearAccessToken,
  getAccessToken,
  subscribeUnauthorized,
} from '@/services/api';
import type { Period, SessionData, UserProfile, UserRole } from '@/services/api-types';

type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

type SessionContextValue = {
  status: SessionStatus;
  user: UserProfile | null;
  period: Period | null;
  role: UserRole | null;
  login: (credentials: { usuario: string; password: string; rol: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: UserProfile) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: React.PropsWithChildren) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);

  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (active) setStatus('anonymous');
          return;
        }
        const current = await api.auth.me();
        if (!active) return;
        setUser(current.usuario);
        setPeriod(current.periodo);
        setStatus('authenticated');
      } catch {
        await clearAccessToken();
        if (!active) return;
        setUser(null);
        setPeriod(null);
        setStatus('anonymous');
      }
    }

    restore();
    const unsubscribe = subscribeUnauthorized(() => {
      clearAccessToken().catch(() => undefined);
      setUser(null);
      setPeriod(null);
      setStatus('anonymous');
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function login(credentials: { usuario: string; password: string; rol: UserRole }) {
    const session: SessionData = await api.auth.login(credentials);
    setUser(session.usuario);
    setPeriod(session.periodo);
    setStatus('authenticated');
  }

  async function logout() {
    try {
      await api.auth.logout();
    } catch {
      await clearAccessToken();
    } finally {
      setUser(null);
      setPeriod(null);
      setStatus('anonymous');
    }
  }

  async function refresh() {
    const current = await api.auth.me();
    setUser(current.usuario);
    setPeriod(current.periodo);
    setStatus('authenticated');
  }

  return (
    <SessionContext.Provider
      value={{
        status,
        user,
        period,
        role: user?.rol ?? null,
        login,
        logout,
        refresh,
        setUser,
      }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider.');
  return context;
}
