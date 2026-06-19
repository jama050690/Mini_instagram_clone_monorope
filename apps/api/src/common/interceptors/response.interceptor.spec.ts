import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

function run<T>(value: T) {
  const interceptor = new ResponseInterceptor<T>();
  const ctx = {} as ExecutionContext;
  const next: CallHandler = { handle: () => of(value) };
  return lastValueFrom(interceptor.intercept(ctx, next));
}

describe('ResponseInterceptor', () => {
  it('oddiy data`ni envelope`ga o`raydi', async () => {
    await expect(run({ id: 1 })).resolves.toEqual({
      success: true,
      data: { id: 1 },
    });
  });

  it('null/primitive ham o`raladi', async () => {
    await expect(run('hi')).resolves.toEqual({ success: true, data: 'hi' });
  });

  it('allaqachon success bo`lgan javobni qayta o`ramaydi', async () => {
    const already = { success: true, data: { x: 1 } };
    await expect(run(already)).resolves.toBe(already);
  });
});
