import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../features/auth/auth-store';
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from './token-storage';
import type { AuthTokens } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

// Attach the current access token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Requests get flagged so we only ever retry once per request, never loop.
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// Deliberately NOT using `apiClient` here — that would run this same
// response interceptor recursively. A refresh token is rotated on every
// use (backend/src/modules/auth/auth.service.ts), so if two requests hit a
// 401 at the same time, they must share the *same* in-flight refresh call
// rather than each firing their own — a second concurrent refresh would be
// rejected because the first one already replaced the stored hash.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const storedRefreshToken = getStoredRefreshToken();
    if (!storedRefreshToken) throw new Error('No refresh token available');

    const { data } = await axios.post<AuthTokens>(
      `${API_BASE_URL}/auth/refresh`,
      null,
      { headers: { Authorization: `Bearer ${storedRefreshToken}` } },
    );

    setStoredRefreshToken(data.refreshToken);
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      const newAccessToken = await refreshAccessToken();
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearStoredRefreshToken();
      useAuthStore.getState().logout();
      window.location.assign('/login');
      return Promise.reject(refreshError);
    }
  },
);
