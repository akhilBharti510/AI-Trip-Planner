import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from '@/lib/config';

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

function subscribeTokenRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Shared Axios instance for all API calls.
 * Layered with request auth headers and silent token refresh.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor injecting authorization token
api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor handling automatic 401 token refresh & queuing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    if (response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh or login requests
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use a clean axios call to refresh to bypass global interceptors
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = data.data.accessToken;
        setAccessToken(newAccessToken);
        onRefreshed(newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-expired'));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
