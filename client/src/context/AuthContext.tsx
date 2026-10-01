import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'staff' | 'admin';
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/api/v1/auth/me');
      if (res.data.success && res.data.data.user) {
        setUser({
          id: res.data.data.user._id || res.data.data.user.id,
          fullName: res.data.data.user.fullName,
          email: res.data.data.user.email,
          role: res.data.data.user.role,
          isVerified: res.data.data.user.isVerified,
        });
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/v1/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.data.user);
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.post('/api/v1/auth/register', { fullName, email, password });
    if (res.data.success) {
      setUser(res.data.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
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
