'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as authService from '@/services/auth.service';
import { setAccessToken } from '@/services/axios';

interface AuthContextType {
  user: authService.User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that do not require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<authService.User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleAuthExpired = React.useCallback(() => {
    setUser(null);
    setAccessToken(null);
    if (!PUBLIC_ROUTES.includes(pathname)) {
      router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const token = await authService.refresh();
        if (token && isMounted) {
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void Promise.resolve().then(initSession);

    // Listen to token refresh failures (dispatched from Axios response interceptor)
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [handleAuthExpired]);

  // Route guarding/redirection logic
  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    if (!user && !isPublic) {
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const handleLogin = async (email: string, password: string, rememberMe = false): Promise<void> => {
    setLoading(true);
    try {
      const result = await authService.login(email, password, rememberMe);
      setUser(result.user);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await authService.register(name, email, password);
      // Automatically log in after registration
      const result = await authService.login(email, password, false);
      setUser(result.user);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
    } catch {
      // Fallback: clear local state even if server fails
    } finally {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
