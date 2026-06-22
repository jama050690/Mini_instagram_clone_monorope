import * as path from 'path';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global sozlamalar (prefiks, cookie, CORS, pipe, interceptor, filter)
  configureApp(app);

  const config = app.get(ConfigService<Env, true>);

  // Uploads papkasini public static fayl sifatida serve qilish (avatar uchun)
  const uploadDir = config.get('UPLOAD_DIR', { infer: true });
  const absUploadDir = path.isAbsolute(uploadDir)
    ? uploadDir
    : path.resolve(process.cwd(), uploadDir);
  app.use('/uploads', express.static(absUploadDir));

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Instagram MVP API')
    .setDescription('Kichik Instagram (MVP) — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  console.log(`🚀 API: http://localhost:${port}/api/v1  |  Docs: /api/docs`);
}
void bootstrap();
