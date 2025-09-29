// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signinUser, signupUser, verifyUserToken } from '../lib/api-auth'; // <-- relative import to lib/api-auth

type User = {
  id?: string;
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

type AuthResult = {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) {
          if (mounted) setIsLoading(false);
          return;
        }
        const profile = await verifyUserToken(token);
        if (mounted && profile?.user) setUser({ ...profile.user, id: profile.user.id ?? profile.user._id });
      } catch (err) {
        console.warn('auth init error', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await signinUser(email, password);
      if (res.success && res.token) {
        await AsyncStorage.setItem(TOKEN_KEY, res.token);
        const normalized = res.user ? { ...res.user, id: res.user.id ?? res.user._id } : null;
        if (normalized) setUser(normalized);
      }
      return res;
    } catch (err: any) {
      console.error('login error', err);
      return { success: false, message: err?.message ?? 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    setIsLoading(true);
    try {
      const res = await signupUser(data);
      if (res.success && res.token) {
        await AsyncStorage.setItem(TOKEN_KEY, res.token);
        const normalized = res.user ? { ...res.user, id: res.user.id ?? res.user._id } : null;
        if (normalized) setUser(normalized);
      }
      return res;
    } catch (err: any) {
      console.error('signup error', err);
      return { success: false, message: err?.message ?? 'Signup failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } catch (err) {
      console.error('signOut error', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
