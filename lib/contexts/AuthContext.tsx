'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { authStateManager } from '@/lib/auth/authStateManager';
import { tokenStore } from '@/lib/auth/tokenStore';
import type { AuthState, User } from '@/lib/types/auth';
import { logError } from '@/lib/utils/errorLogger';

/** Interface defining the shape of the authentication context */
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeader: () => string;
  getUserInfo: () => User | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider component that wraps the app and makes auth object available to any child component that calls useAuth().
 * @param children - Child components that will have access to the auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthState>(() => ({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  }));

  const isLoginInProgress = useRef(false);
  const retryCount = useRef(0);

  /**
   * Checks if there is a valid session cookie present
   * @returns boolean indicating if a valid session exists
   */
  const hasValidSession = useCallback((): boolean => {
    if (typeof document === 'undefined') return false;
    return document.cookie.includes('has-session=true');
  }, []);

  /**
   * Fetches the current user's data from the server
   * @param signal - AbortSignal for cancelling the request
   * @returns Promise resolving to the user data or null if not authenticated
   */
  const fetchCurrentUser = useCallback(async (signal: AbortSignal): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal,
      });

      if (signal.aborted) {
        return null;
      }

      if (!response.ok) {
        if (response.status === 401) {
          tokenStore.clearToken();
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success || !data.user) {
        tokenStore.clearToken();
        return null;
      }

      return data.user;
    } catch (error) {
      if (signal.aborted) {
        return null;
      }
      console.error('Error fetching current user:', error);
      tokenStore.clearToken();
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async (signal: AbortSignal) => {
      try {
        const hasSession = hasValidSession();

        if (!hasSession) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
          return;
        }

        const user = await fetchCurrentUser(signal);

        if (signal.aborted || !mounted) {
          return;
        }

        if (user) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
        }
      } catch (error) {
        if (signal.aborted || !mounted) {
          return;
        }

        logError('AuthProvider', 'Error initializing auth', { error });
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    };

    authStateManager.initialize(initializeAuth);

    return () => {
      mounted = false;
      authStateManager.cancelInitialization();
    };
  }, [hasValidSession, fetchCurrentUser]);

  /**
   * Attempts to log in a user with the provided credentials
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to true if login was successful, false otherwise
   */
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (isLoginInProgress.current) {
        return false;
      }

      try {
        isLoginInProgress.current = true;

        setAuthState((prev) => ({
          ...prev,
          isLoading: true,
        }));

        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
          });
          return false;
        }

        if (data.token) {
          tokenStore.setToken(data.token);
        }

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
        router.push('/requests');

        return true;
      } catch {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
        return false;
      } finally {
        isLoginInProgress.current = false;
      }
    },
    [router]
  );

  /**
   * Logs out the current user by clearing auth state and redirecting to login page
   */
  const logout = useCallback(async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }

    tokenStore.clearToken();
    authStateManager.reset();
    retryCount.current = 0;
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
    router.push('/login');
  }, [router]);

  /**
   * Gets the authorization header for API requests
   * @returns Authorization header string (Bearer token or 'Cookie')
   */
  const getAuthHeader = useCallback(() => {
    const existingToken = tokenStore.getToken();

    if (existingToken) {
      return `Bearer ${existingToken}`;
    }

    return 'Cookie';
  }, []);

  /**
   * Gets the current user's information
   * @returns Current user object or null if not authenticated
   */
  const getUserInfo = useCallback(() => {
    return authState.user;
  }, [authState.user]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    getAuthHeader,
    getUserInfo,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the authentication context
 * @returns Authentication context object
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
