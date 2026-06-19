/** Backend javob envelope'i (AllExceptionsFilter / ResponseInterceptor). */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

/** Cursor-based sahifa (backend `common/utils/pagination`). */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
