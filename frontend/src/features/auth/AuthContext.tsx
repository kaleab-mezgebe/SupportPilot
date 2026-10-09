import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../../types';
import { ApiService } from '../../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role?: UserRole, organizationName?: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, { email: string; name: string }> = {
  SupportAgent: { email: 'alex.rivera@supportpilot.io', name: 'Alex Rivera' },
  Customer: { email: 'sarah@cyberdyne.io', name: 'Sarah Connor' },
  SystemAdministrator: { email: 'admin@supportpilot.io', name: 'System Administrator' },
  SupportManager: { email: 'alex.rivera@supportpilot.io', name: 'Alex Rivera' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('supportpilot_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('supportpilot_token');
      if (savedToken) {
        try {
          const userProfile = await ApiService.getCurrentUser(savedToken);
          if (userProfile) {
            setUser(userProfile);
            setToken(savedToken);
          } else {
            // Fallback to default demo agent if token expired/mock mode
            setDemoFallbackUser('SupportAgent');
          }
        } catch {
          setDemoFallbackUser('SupportAgent');
        }
      } else {
        // Default to demo agent for instant workspace exploration
        setDemoFallbackUser('SupportAgent');
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const setDemoFallbackUser = (role: UserRole) => {
    const demo = DEMO_USERS[role];
    setUser({
      id: role === 'SupportAgent' ? '22222222-2222-2222-2222-222222222222' : '33333333-3333-3333-3333-333333333333',
      email: demo.email,
      fullName: demo.name,
      role: role,
      organizationName: 'SupportPilot HQ',
      createdAtUtc: new Date().toISOString()
    });
  };

  const login = async (email: string, password: string) => {
    const res = await ApiService.login(email, password);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('supportpilot_token', res.token);
  };

  const register = async (fullName: string, email: string, password: string, role: UserRole = 'Customer', organizationName?: string) => {
    const res = await ApiService.register({ fullName, email, password, role, organizationName });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('supportpilot_token', res.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('supportpilot_token');
  };

  const switchDemoUser = async (role: UserRole) => {
    const demo = DEMO_USERS[role];
    try {
      await login(demo.email, 'Password123!');
    } catch {
      setDemoFallbackUser(role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoUser
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
