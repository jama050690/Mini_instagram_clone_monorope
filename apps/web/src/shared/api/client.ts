import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  getAccessToken,
  notifyAuthFailure,
  setAccessToken,
} from './auth-token';
import type { ApiSuccess } from './types';

/**
 * Markaziy axios instance. `/api/v1` ga ulanadi, refresh cookie yuborilishi
 * uchun `withCredentials`. Request interceptor access token qo'shadi; response
 * interceptor 401'da bir marta refresh qilib, so'rovni qayta yuboradi.
 */
export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh endpointi alohida instance — interceptor loop bo'lmasligi uchun.
const refreshClient = axios.create({ baseURL: '/api/v1', withCredentials: true });

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Bir vaqtning o'zida ko'p 401 kelganda bitta refresh chaqiriladi.
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = refreshClient
      .post<ApiSuccess<{ accessToken: string }>>('/auth/refresh')
      .then((res) => {
        const token = res.data.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        setAccessToken(null);
        notifyAuthFailure();
      }
    }
    return Promise.reject(error);
  },
);
