import { api, setAccessToken } from '@/services/axios';
import type { ApiSuccess } from '@/types/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  user: User;
  accessToken: string;
}

export interface RefreshResult {
  accessToken: string;
}

/**
 * Register a new user.
 */
export async function register(name: string, email: string, password: string): Promise<User> {
  const { data } = await api.post<ApiSuccess<User>>('/auth/register', {
    name,
    email,
    password,
  });
  return data.data;
}

/**
 * Log in an existing user.
 */
export async function login(email: string, password: string, rememberMe = false): Promise<LoginResult> {
  const { data } = await api.post<ApiSuccess<LoginResult>>('/auth/login', {
    email,
    password,
    rememberMe,
  });
  // Set token in Axios memory
  setAccessToken(data.data.accessToken);
  return data.data;
}

/**
 * Log out the active session.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    // Clear token in Axios memory regardless of API response
    setAccessToken(null);
  }
}

/**
 * Silent JWT token refresh rotation request.
 */
export async function refresh(): Promise<string> {
  const { data } = await api.post<ApiSuccess<RefreshResult>>('/auth/refresh');
  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
}

/**
 * Fetch profile data of the logged-in user.
 */
export async function getProfile(): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>('/auth/me');
  return data.data;
}
