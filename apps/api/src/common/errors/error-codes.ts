/**
 * Barqaror xato kodlari (string enum). Frontend shu kodlar bo'yicha
 * foydalanuvchiga xabar ko'rsatadi — kodlar o'zgarmasligi kerak.
 * Har modul o'z kodlarini shu yerga qo'shib boradi.
 */
export const ErrorCode = {
  // Umumiy
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Auth (M1)
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_BLOCKED: 'USER_BLOCKED',

  // Media / avatar (M2, M3)
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Post (M4)
  INVALID_MEDIA_COUNT: 'INVALID_MEDIA_COUNT',
  MIXED_MEDIA: 'MIXED_MEDIA',

  // Follow (M4.6)
  SELF_FOLLOW: 'SELF_FOLLOW',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
