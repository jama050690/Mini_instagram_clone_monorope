import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { resolve } from 'path';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { Env } from './config/env.validation';

/**
 * Global ilova konfiguratsiyasi — main.ts (prod) va e2e testlar **bir xil**
 * sozlamadan foydalanishi uchun bitta joyda. Swagger faqat main.ts'da.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());

  // Avatar fayllari public — `/uploads/avatars/{userId}.{ext}` static beriladi
  // (API prefiksidan tashqarida). Post media esa M3'da avtorizatsiyali stream.
  app.use(
    '/uploads',
    express.static(resolve(config.get('UPLOAD_DIR', { infer: true }))),
  );

  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
}
