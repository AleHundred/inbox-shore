export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthToken {
  token: string;
  expires: number;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  expiresAt?: number;
  error?: string;
}

export interface StoredAuthData {
  token: string;
  user: User;
  expiresAt: number;
}

export interface AuthHeaders {
  Authorization?: string;
  'Content-Type'?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}
