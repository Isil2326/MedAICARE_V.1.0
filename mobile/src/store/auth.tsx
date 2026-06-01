/**
 * Contexte d'authentification global.
 *
 * - Restaure la session au démarrage (jeton sécurisé → /auth/me).
 * - Expose login / logout et l'utilisateur courant (avec son rôle).
 * - Réagit à l'expiration de session (handler enregistré dans le client API).
 * - Aucun jeton n'est exposé via ce contexte ni journalisé.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as authService from '@/services/api/auth';
import { registerAuthExpiredHandler } from '@/services/api/client';
import { getAccessToken } from '@/services/secureStore';
import type { Role, UserPublic } from '@/types/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: UserPublic | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<UserPublic>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserPublic | null>(null);

  const handleExpired = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    registerAuthExpiredHandler(handleExpired);
    return () => registerAuthExpiredHandler(null);
  }, [handleExpired]);

  // Restauration de session au démarrage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (!cancelled) setStatus('unauthenticated');
          return;
        }
        const profile = await authService.me();
        if (!cancelled) {
          setUser(profile);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const profile = await authService.login(email, password);
    setUser(profile);
    setStatus('authenticated');
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await authService.me();
    setUser(profile);
    setStatus('authenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role: user?.role ?? null,
      login,
      logout,
      refreshProfile,
    }),
    [status, user, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  }
  return ctx;
}
