import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccess } from '../dto/api-response';

/**
 * Barcha muvaffaqiyatli javoblarni `{ success: true, data }` envelope'iga o'raydi.
 * Agar handler allaqachon `{ success: ... }` qaytarsa (kamdan-kam), qayta o'ramaydi.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data: T) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in (data as Record<string, unknown>)
        ) {
          return data as unknown as ApiSuccess<T>;
        }
        return { success: true, data };
      }),
    );
  }
}
