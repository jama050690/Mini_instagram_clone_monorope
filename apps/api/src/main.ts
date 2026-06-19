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

  // Swagger (faqat prod ilovada)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Instagram MVP API')
    .setDescription('Kichik Instagram (MVP) — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const config = app.get(ConfigService<Env, true>);
  const port = config.get('PORT', { infer: true });
  await app.listen(port);

  console.log(`🚀 API: http://localhost:${port}/api/v1  |  Docs: /api/docs`);
}
void bootstrap();
