import { createHash } from 'crypto';

/**
 * Refresh token kabi yuqori-entropiyali qiymatlarni tez xeshlash uchun (SHA-256).
 * Parollar uchun emas — parollar bcrypt bilan (PasswordService).
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
