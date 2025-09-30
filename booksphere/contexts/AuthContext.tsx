// booksphere/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signinUser, signupUser, verifyUserToken } from '../lib/api-auth';

type User = {
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; token?: string; user?: User }>;
  register: (payload: { email: string; password: string; firstName: string; lastName: string }) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const res = await verifyUserToken(token);
          if (res?.success && res.user) {
            setUser(res.user);
          } else {
            await AsyncStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth init err', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await signinUser(email, password);
    if (res?.success && res.token) {
      await AsyncStorage.setItem('token', res.token);
      setUser(res.user ?? null);
    }
    return res;
  };

  const register = async (payload: { email: string; password: string; firstName: string; lastName: string }) => {
    const res = await signupUser(payload);
    if (res?.success && res.token) {
      await AsyncStorage.setItem('token', res.token);
      setUser(res.user ?? null);
    }
    return res;
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
