import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  getDashboardPath: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('metrion_user') || localStorage.getItem('legalmet_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('metrion_token') || localStorage.getItem('legalmet_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const freshUser = await api.auth.me();
          setUser(freshUser);
          localStorage.setItem('metrion_user', JSON.stringify(freshUser));
        } catch {
          // invalid token
          logout();
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password: pass });
      localStorage.setItem('metrion_token', res.access_token);
      localStorage.setItem('metrion_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      localStorage.setItem('metrion_token', res.access_token);
      localStorage.setItem('metrion_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      api.auth.logout().catch(() => {});
    } finally {
      localStorage.removeItem('metrion_token');
      localStorage.removeItem('metrion_user');
      localStorage.removeItem('legalmet_token');
      localStorage.removeItem('legalmet_user');
      setToken(null);
      setUser(null);
    }
  };

  const getDashboardPath = (userRole?: UserRole): string => {
    const r = userRole || user?.role;
    switch (r) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'INSTRUMENT_OWNER':
        return '/owner/dashboard';
      case 'LMO':
        return '/lmo/dashboard';
      case 'GATC':
        return '/gatc/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
