import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiError } from '../dto/api-response';
import { ErrorCode } from '../errors/error-codes';
import { AppException } from '../exceptions/app.exception';

/**
 * Barcha xatolarni standart error-envelope'ga keltiradi (Technical_SRS §2.2).
 * Tartib: AppException → HttpException (Nest, ValidationPipe) → Prisma → noma'lum.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, body } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${status} ${body.error.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; body: ApiError } {
    // 1. Domain xatolari (AppException)
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        body: {
          success: false,
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details,
          },
        },
      };
    }

    // 2. Nest HttpException (ValidationPipe, NotFoundException, guard'lar...)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const { message, details } = this.extractHttpMessage(response);
      return {
        status,
        body: {
          success: false,
          error: { code: this.statusToCode(status), message, details },
        },
      };
    }

    // 3. Prisma ma'lum xatolari
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrisma(exception);
    }

    // 4. Noma'lum — 500
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Ichki server xatosi',
        },
      },
    };
  }

  private extractHttpMessage(response: string | object): {
    message: string;
    details?: unknown;
  } {
    if (typeof response === 'string') {
      return { message: response };
    }
    const r = response as Record<string, unknown>;
    const rawMessage = r.message;
    // ValidationPipe massiv qaytaradi → details'ga, message umumiy
    if (Array.isArray(rawMessage)) {
      return { message: 'Validatsiya xatosi', details: rawMessage };
    }
    return {
      message: typeof rawMessage === 'string' ? rawMessage : 'Xato',
      details: r.details,
    };
  }

  private resolvePrisma(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    body: ApiError;
  } {
    switch (exception.code) {
      case 'P2002': // unique constraint
        return {
          status: HttpStatus.CONFLICT,
          body: {
            success: false,
            error: {
              code: ErrorCode.CONFLICT,
              message: 'Bu qiymat allaqachon band',
              details: exception.meta?.target,
            },
          },
        };
      case 'P2025': // record not found
        return {
          status: HttpStatus.NOT_FOUND,
          body: {
            success: false,
            error: { code: ErrorCode.NOT_FOUND, message: 'Topilmadi' },
          },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            success: false,
            error: {
              code: ErrorCode.INTERNAL_ERROR,
              message: 'Ma`lumotlar bazasi xatosi',
            },
          },
        };
    }
  }

  private statusToCode(status: number): ErrorCode {
    return STATUS_CODE_MAP[status] ?? ErrorCode.INTERNAL_ERROR;
  }
}

const STATUS_CODE_MAP: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
};
