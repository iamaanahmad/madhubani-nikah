'use client';

import React, { createContext, useContext } from 'react';
import { useAuthState } from '@/hooks/useAuth';
import { Models } from 'appwrite';

interface AuthResult {
  success: boolean;
  user?: Models.User<Models.Preferences>;
  session?: Models.Session;
  error?: string;
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
