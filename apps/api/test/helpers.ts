import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
}

/**
 * To'liq Nest ilovasini (real modullar + real test DB) ko'taradi —
 * prod bilan bir xil global konfiguratsiya (configureApp).
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

/**
 * Barcha jadvallarni tozalaydi (testlar orasida izolyatsiya).
 * FK tartibiga e'tibor — TRUNCATE ... CASCADE ishlatamiz.
 */
export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "RefreshToken", "Comment", "Like", "Media", "Follow", "Post", "User" RESTART IDENTITY CASCADE;`,
  );
}

export interface AuthedUser {
  id: string;
  username: string;
  email: string;
  accessToken: string;
}

/**
 * Test foydalanuvchisini register qiladi va `{id, username, email, accessToken}`
 * qaytaradi — himoyalangan endpointlarni Bearer bilan chaqirish uchun.
 */
export async function registerUser(
  app: INestApplication,
  overrides: Partial<{
    email: string;
    password: string;
    username: string;
    fullName: string;
  }> = {},
): Promise<AuthedUser> {
  const body = {
    email: overrides.email ?? `${overrides.username ?? 'user'}@example.com`,
    password: overrides.password ?? 'parol1234',
    username: overrides.username ?? 'user',
    fullName: overrides.fullName ?? 'Test User',
  };
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send(body)
    .expect(201);

  return {
    id: res.body.data.user.id,
    username: res.body.data.user.username,
    email: res.body.data.user.email,
    accessToken: res.body.data.accessToken,
  };
}
