import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const ctx = await createTestApp();
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
  const auth = (u: AuthedUser) => ({
    Authorization: `Bearer ${u.accessToken}`,
  });

  describe('PATCH /profile', () => {
    it('fullName va bio ni yangilaydi', async () => {
      const me = await registerUser(app, { username: 'aziz' });

      const res = await http()
        .patch('/api/v1/profile')
        .set(auth(me))
        .send({ fullName: 'Aziz Karim', bio: 'Salom dunyo' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        fullName: 'Aziz Karim',
        bio: 'Salom dunyo',
        username: 'aziz',
      });
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it("username ni o'zgartiradi (unikal bo'lsa)", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http()
        .patch('/api/v1/profile')
        .set(auth(me))
        .send({ username: 'aziz_new' });
      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('aziz_new');
    });

    it('band username → 409 USERNAME_TAKEN', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      await registerUser(app, { username: 'bobur' });
      const res = await http()
        .patch('/api/v1/profile')
        .set(auth(me))
        .send({ username: 'bobur' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USERNAME_TAKEN');
    });

    it("noto'g'ri formatdagi username → 400", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http()
        .patch('/api/v1/profile')
        .set(auth(me))
        .send({ username: 'Aziz Bek!' });
      expect(res.status).toBe(400);
    });

    it("qisman yangilash (faqat bio) qolgan maydonlarni o'zgartirmaydi", async () => {
      const me = await registerUser(app, {
        username: 'aziz',
        fullName: 'Aziz K',
      });
      const res = await http()
        .patch('/api/v1/profile')
        .set(auth(me))
        .send({ bio: 'faqat bio' });
      expect(res.body.data).toMatchObject({
        fullName: 'Aziz K',
        username: 'aziz',
        bio: 'faqat bio',
      });
    });

    it("token'siz → 401", async () => {
      await registerUser(app, { username: 'aziz' });
      const res = await http().patch('/api/v1/profile').send({ bio: 'x' });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /profile/privacy', () => {
    it("isPrivate=true ga o'tkazadi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http()
        .patch('/api/v1/profile/privacy')
        .set(auth(me))
        .send({ isPrivate: true });
      expect(res.status).toBe(200);
      expect(res.body.data.isPrivate).toBe(true);
    });

    it("Private→Public o'tilsa, PENDING follow so'rovlari ACCEPTED bo'ladi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      await prisma.user.update({
        where: { id: me.id },
        data: { isPrivate: true },
      });
      const fan1 = await registerUser(app, { username: 'fan1' });
      const fan2 = await registerUser(app, { username: 'fan2' });
      await prisma.follow.createMany({
        data: [
          { followerId: fan1.id, followingId: me.id, status: 'PENDING' },
          { followerId: fan2.id, followingId: me.id, status: 'PENDING' },
        ],
      });

      const res = await http()
        .patch('/api/v1/profile/privacy')
        .set(auth(me))
        .send({ isPrivate: false });
      expect(res.status).toBe(200);
      expect(res.body.data.isPrivate).toBe(false);

      const pending = await prisma.follow.count({
        where: { followingId: me.id, status: 'PENDING' },
      });
      expect(pending).toBe(0);
      const accepted = await prisma.follow.count({
        where: { followingId: me.id, status: 'ACCEPTED' },
      });
      expect(accepted).toBe(2);
    });

    it("Public→Private o'tilsa, mavjud ACCEPTED obunachilar saqlanadi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const fan = await registerUser(app, { username: 'fan' });
      await prisma.follow.create({
        data: { followerId: fan.id, followingId: me.id, status: 'ACCEPTED' },
      });

      await http()
        .patch('/api/v1/profile/privacy')
        .set(auth(me))
        .send({ isPrivate: true })
        .expect(200);

      const accepted = await prisma.follow.count({
        where: { followingId: me.id, status: 'ACCEPTED' },
      });
      expect(accepted).toBe(1);
    });

    it("isPrivate noto'g'ri tur → 400", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http()
        .patch('/api/v1/profile/privacy')
        .set(auth(me))
        .send({ isPrivate: 'ha' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /profile/avatar & DELETE /profile/avatar', () => {
    // Minimal haqiqiy JPEG (magic-byte FF D8 FF + qolgani 0)
    const jpeg = () => {
      const b = Buffer.alloc(2048);
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]).copy(b, 0);
      return b;
    };

    it("haqiqiy jpg yuklaydi → avatarUrl o'rnatiladi va fayl serve qilinadi", async () => {
      const me = await registerUser(app, { username: 'aziz' });

      const res = await http()
        .post('/api/v1/profile/avatar')
        .set(auth(me))
        .attach('avatar', jpeg(), {
          filename: 'a.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.avatarUrl).toBe(`/uploads/avatars/${me.id}.jpg`);

      // DB'da ham saqlangan
      const row = await prisma.user.findUnique({ where: { id: me.id } });
      expect(row?.avatarUrl).toBe(`/uploads/avatars/${me.id}.jpg`);

      // static endpoint orqali o'qiladi
      const file = await http().get(`/uploads/avatars/${me.id}.jpg`);
      expect(file.status).toBe(200);
    });

    it('hajmi 2MB dan oshsa → 413 FILE_TOO_LARGE', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const big = Buffer.alloc(2 * 1024 * 1024 + 10);
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]).copy(big, 0);

      const res = await http()
        .post('/api/v1/profile/avatar')
        .set(auth(me))
        .attach('avatar', big, {
          filename: 'big.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it("kontenti rasm bo'lmagan fayl (magic-byte) → 400 INVALID_FILE_TYPE", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const fake = Buffer.from('%PDF-1.4 fake');

      const res = await http()
        .post('/api/v1/profile/avatar')
        .set(auth(me))
        .attach('avatar', fake, {
          filename: 'evil.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it("avatarni o'chiradi → avatarUrl null va fayl yo'qoladi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      await http()
        .post('/api/v1/profile/avatar')
        .set(auth(me))
        .attach('avatar', jpeg(), {
          filename: 'a.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      const res = await http().delete('/api/v1/profile/avatar').set(auth(me));
      expect(res.status).toBe(200);
      expect(res.body.data.avatarUrl).toBeNull();

      const file = await http().get(`/uploads/avatars/${me.id}.jpg`);
      expect(file.status).toBe(404);
    });

    it("token'siz → 401", async () => {
      await registerUser(app, { username: 'aziz' });
      const res = await http()
        .post('/api/v1/profile/avatar')
        .attach('avatar', jpeg(), {
          filename: 'a.jpg',
          contentType: 'image/jpeg',
        });
      expect(res.status).toBe(401);
    });
  });
});
