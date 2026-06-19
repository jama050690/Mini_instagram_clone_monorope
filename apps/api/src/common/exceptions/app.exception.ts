import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../errors/error-codes';

/**
 * Domain xatolari uchun. HTTP status + barqaror `code` + xabar (+ details)
 * tashiydi. `AllExceptionsFilter` buni envelope'ga aylantiradi.
 *
 * Misol:
 *   throw new AppException(HttpStatus.CONFLICT, ErrorCode.EMAIL_TAKEN, 'Email band');
 */
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }

  static conflict(code: ErrorCode, message: string, details?: unknown) {
    return new AppException(HttpStatus.CONFLICT, code, message, details);
  }

  static notFound(message = 'Topilmadi', details?: unknown) {
    return new AppException(
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND,
      message,
      details,
    );
  }

  static unauthorized(
    message = 'Avtorizatsiya talab qilinadi',
    details?: unknown,
  ) {
    return new AppException(
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED,
      message,
      details,
    );
  }

  static forbidden(message = 'Ruxsat yo`q', details?: unknown) {
    return new AppException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      message,
      details,
    );
  }

  static badRequest(message = 'Noto`g`ri so`rov', details?: unknown) {
    return new AppException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.BAD_REQUEST,
      message,
      details,
    );
  }
}
