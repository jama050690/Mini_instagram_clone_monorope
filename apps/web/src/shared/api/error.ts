import { AxiosError } from 'axios';
import type { ApiError } from './types';

/** Backend xato envelope'idan `code`ni oladi (bo'lmasa undefined). */
export function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    return data?.error?.code;
  }
  return undefined;
}

/** Foydalanuvchiga ko'rsatish uchun xato xabari. */
export function getApiErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.code === 'ERR_NETWORK') return 'Serverga ulanib bo`lmadi';
  }
  return fallback;
}
