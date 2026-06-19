import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, resetDb, TestContext } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';
import { GoogleAuthService } from '../src/modules/auth/google-auth.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const validUser = {
    email: 'aziz@example.com',
    password: 'parol1234',
    username: 'aziz',
    fullName: 'Aziz Karimov',
  };

  beforeAll(async () => {
    const ctx: TestContext = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  const http = () => request(app.getHttpServer());

  /** set-cookie'dan refreshToken qiymatini ajratib oladi. */
  function extractRefresh(res: request.Response): string {
    const cookies = res.headers['set-cookie'] as unknown as string[];
    const raw = cookies.find((c) => c.startsWith('refreshToken='));
    return raw!.split(';')[0].split('=')[1];
  }

  describe('POST /auth/register', () => {
    it('yangi foydalanuvchini yaratadi → user + accessToken + refresh cookie', async () => {
      const res = await http().post('/api/v1/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.user).toMatchObject({
        email: validUser.email,
        username: validUser.username,
        fullName: validUser.fullName,
        role: 'USER',
        isPrivate: false,
      });
      // parol hech qachon qaytarilmaydi
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // refresh token httpOnly cookie'da
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
      expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true);
    });

    it('parolni ochiq saqlamaydi (bcrypt hash)', async () => {
      await http().post('/api/v1/auth/register').send(validUser).expect(201);
      const row = await prisma.user.findUnique({
        where: { email: validUser.email },
      });
      expect(row?.passwordHash).toBeTruthy();
      expect(row?.passwordHash).not.toBe(validUser.password);
    });

    it('email band bo`lsa → 409 EMAIL_TAKEN', async () => {
      await http().post('/api/v1/auth/register').send(validUser).expect(201);
      const res = await http()
        .post('/api/v1/auth/register')
        .send({ ...validUser, username: 'boshqa' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('username band bo`lsa → 409 USERNAME_TAKEN', async () => {
      await http().post('/api/v1/auth/register').send(validUser).expect(201);
      const res = await http()
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'boshqa@example.com' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USERNAME_TAKEN');
    });

    it('parol 8 belgidan qisqa → 400 validatsiya', async () => {
      const res = await http()
        .post('/api/v1/auth/register')
        .send({ ...validUser, password: 'qisqa' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await http().post('/api/v1/auth/register').send(validUser).expect(201);
    });

    it('to`g`ri parol bilan → user + accessToken + refresh cookie', async () => {
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.user.username).toBe(validUser.username);
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('noto`g`ri parol → 401 INVALID_CREDENTIALS', async () => {
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'notogriparol' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('mavjud bo`lmagan email → 401 INVALID_CREDENTIALS', async () => {
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: 'yoq@example.com', password: validUser.password });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('OAuth-only user (parolsiz) login qila olmaydi → 401', async () => {
      await prisma.user.update({
        where: { email: validUser.email },
        data: { passwordHash: null },
      });
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('bloklangan user → 403 USER_BLOCKED', async () => {
      await prisma.user.update({
        where: { email: validUser.email },
        data: { isBlocked: true },
      });
      const res = await http()
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('USER_BLOCKED');
    });
  });

  describe('GET /auth/me', () => {
    async function registerAndToken(): Promise<string> {
      const res = await http()
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);
      return res.body.data.accessToken as string;
    }

    it('valid token bilan → joriy user', async () => {
      const token = await registerAndToken();
      const res = await http()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(validUser.email);
      expect(res.body.data.username).toBe(validUser.username);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('tokensiz → 401', async () => {
      const res = await http().get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('bloklangan user token bilan ham kira olmaydi → 403 USER_BLOCKED', async () => {
      const token = await registerAndToken();
      await prisma.user.update({
        where: { email: validUser.email },
        data: { isBlocked: true },
      });
      const res = await http()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('USER_BLOCKED');
    });
  });

  describe('POST /auth/refresh & /auth/logout', () => {
    async function register(): Promise<request.Response> {
      return http().post('/api/v1/auth/register').send(validUser).expect(201);
    }

    it('refresh cookie bilan → yangi accessToken + rotatsiya qilingan cookie', async () => {
      const reg = await register();
      const oldRefresh = extractRefresh(reg);

      const res = await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${oldRefresh}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      const newRefresh = extractRefresh(res);
      expect(newRefresh).not.toBe(oldRefresh); // rotatsiya
    });

    it('cookiesiz refresh → 401', async () => {
      const res = await http().post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('rotatsiyadan keyin eski token qayta ishlatilsa → 401 (reuse)', async () => {
      const reg = await register();
      const oldRefresh = extractRefresh(reg);
      // birinchi rotatsiya
      await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${oldRefresh}`)
        .expect(200);
      // eski tokenni qayta ishlatish
      const res = await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${oldRefresh}`);
      expect(res.status).toBe(401);
    });

    it('reuse aniqlanganda barcha sessiyalar bekor qilinadi', async () => {
      const reg = await register();
      const oldRefresh = extractRefresh(reg);
      const rotated = await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${oldRefresh}`)
        .expect(200);
      const newRefresh = extractRefresh(rotated);

      // eski (bekor qilingan) tokenni qayta ishlatish → reuse signal
      await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${oldRefresh}`)
        .expect(401);

      // endi yangi token ham ishlamaydi (hammasi bekor)
      const res = await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${newRefresh}`);
      expect(res.status).toBe(401);
    });

    it('logout → refresh bekor qilinadi, keyin refresh 401', async () => {
      const reg = await register();
      const refresh = extractRefresh(reg);
      const accessToken = reg.body.data.accessToken as string;

      await http()
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', `refreshToken=${refresh}`)
        .expect(200);

      const res = await http()
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refresh}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Google OAuth + onboarding', () => {
    const profile = {
      googleId: 'google-123',
      email: 'gmail@example.com',
      fullName: 'Google User',
      avatarUrl: 'https://example.com/a.png',
    };

    let google: GoogleAuthService;

    beforeAll(() => {
      google = app.get(GoogleAuthService);
    });

    it('signIn: yangi user → onboarding (registrationToken)', async () => {
      const out = await google.signIn(profile);
      expect(out.kind).toBe('onboarding');
    });

    it('signIn: mavjud email → googleId ulanadi, authenticated', async () => {
      await http().post('/api/v1/auth/register').send(validUser).expect(201);
      const out = await google.signIn({ ...profile, email: validUser.email });
      expect(out.kind).toBe('authenticated');
      const linked = await prisma.user.findUnique({
        where: { email: validUser.email },
      });
      expect(linked?.googleId).toBe(profile.googleId);
    });

    it('complete: valid token + bo`sh username → user + accessToken', async () => {
      const registrationToken = await google.buildRegistrationToken(profile);
      const res = await http()
        .post('/api/v1/auth/google/complete')
        .send({ registrationToken, username: 'googler' });

      expect(res.status).toBe(201);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe(profile.email);
      expect(res.body.data.user.username).toBe('googler');
      const created = await prisma.user.findUnique({
        where: { email: profile.email },
      });
      expect(created?.googleId).toBe(profile.googleId);
      expect(created?.passwordHash).toBeNull();
    });

    it('complete: username band → 409 USERNAME_TAKEN', async () => {
      await http().post('/api/v1/auth/register').send(validUser).expect(201);
      const registrationToken = await google.buildRegistrationToken(profile);
      const res = await http()
        .post('/api/v1/auth/google/complete')
        .send({ registrationToken, username: validUser.username });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USERNAME_TAKEN');
    });

    it('complete: yaroqsiz token → 401', async () => {
      const res = await http()
        .post('/api/v1/auth/google/complete')
        .send({ registrationToken: 'axlat.token.qiymat', username: 'kimdir' });
      expect(res.status).toBe(401);
    });
  });
});
