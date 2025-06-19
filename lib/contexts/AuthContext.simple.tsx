'use client';

import React, { createContext, useContext, useState } from 'react';

import type { AuthState, User } from '@/lib/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeader: () => string;
  getUserInfo: () => User | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState] = useState<AuthState>(() => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
  }));

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Simple login called', { email, password });
    return false;
  };

  const logout = () => {
    console.log('Simple logout called');
  };

  const getAuthHeader = () => {
    return 'Bearer test';
  };

  const getUserInfo = () => {
    return null;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    getAuthHeader,
    getUserInfo,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
