import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, UserRole, Session } from './authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, role: UserRole, specialty?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  canAccess: (view: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier session au chargement
    const currentUser = authService.getCurrentUser();
    const currentSession = authService.getCurrentSession();
    
    if (currentUser && currentSession) {
      setUser(currentUser);
      setSession(currentSession);
    }
    
    setLoading(false);

    // Vérifier expiration toutes les minutes
    const interval = setInterval(() => {
      const validSession = authService.getCurrentSession();
      if (!validSession) {
        setUser(null);
        setSession(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    
    if (result.success && result.user && result.session) {
      setUser(result.user);
      setSession(result.session);
      return { success: true };
    }
    
    return { success: false, error: result.error };
  };

  const register = async (email: string, password: string, name: string, role: UserRole, specialty?: string) => {
    const result = await authService.register(email, password, name, role, specialty);
    
    if (result.success && result.user) {
      const currentUser = authService.getCurrentUser();
      const currentSession = authService.getCurrentSession();
      setUser(currentUser);
      setSession(currentSession);
      return { success: true };
    }
    
    return { success: false, error: result.error };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setSession(null);
  };

  const canAccess = (view: string): boolean => {
    if (!user) return false;
    return authService.canAccess(user.role, view);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}