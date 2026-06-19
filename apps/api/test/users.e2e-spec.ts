import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users (e2e)', () => {
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

  describe('GET /users/:username', () => {
    it("o'z profilini qaytaradi → relationship=self, canViewPosts=true, counts", async () => {
      const me = await registerUser(app, { username: 'aziz' });

      const res = await http()
        .get(`/api/v1/users/${me.username}`)
        .set(auth(me));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: me.id,
        username: 'aziz',
        relationship: 'self',
        canViewPosts: true,
      });
      expect(res.body.data.counts).toEqual({
        posts: 0,
        followers: 0,
        following: 0,
      });
      // maxfiy maydonlar yo'q
      expect(res.body.data.email).toBeUndefined();
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it("public user'ning profili boshqaga to'liq ko'rinadi → relationship=none", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const other = await registerUser(app, { username: 'bobur' });

      const res = await http()
        .get(`/api/v1/users/${other.username}`)
        .set(auth(me));

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        username: 'bobur',
        relationship: 'none',
        canViewPosts: true,
        isPrivate: false,
      });
    });

    it('private user, non-follower → qobiq (canViewPosts=false)', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const other = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: other.id },
        data: { isPrivate: true },
      });

      const res = await http()
        .get(`/api/v1/users/${other.username}`)
        .set(auth(me));

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        username: 'bobur',
        isPrivate: true,
        relationship: 'none',
        canViewPosts: false,
      });
      // qobiqda ham counts ko'rinadi
      expect(res.body.data.counts).toBeDefined();
    });

    it('private user, tasdiqlangan follower → relationship=following, canViewPosts=true', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const other = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: other.id },
        data: { isPrivate: true },
      });
      await prisma.follow.create({
        data: { followerId: me.id, followingId: other.id, status: 'ACCEPTED' },
      });

      const res = await http()
        .get(`/api/v1/users/${other.username}`)
        .set(auth(me));

      expect(res.body.data).toMatchObject({
        relationship: 'following',
        canViewPosts: true,
      });
    });

    it("private user, pending so'rov → relationship=requested, canViewPosts=false", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const other = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: other.id },
        data: { isPrivate: true },
      });
      await prisma.follow.create({
        data: { followerId: me.id, followingId: other.id, status: 'PENDING' },
      });

      const res = await http()
        .get(`/api/v1/users/${other.username}`)
        .set(auth(me));

      expect(res.body.data).toMatchObject({
        relationship: 'requested',
        canViewPosts: false,
      });
    });

    it("mavjud bo'lmagan username → 404", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http().get('/api/v1/users/yoq').set(auth(me));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('bloklangan user boshqaga 404 (mavjud emasdek)', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const other = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: other.id },
        data: { isBlocked: true },
      });

      const res = await http()
        .get(`/api/v1/users/${other.username}`)
        .set(auth(me));
      expect(res.status).toBe(404);
    });

    it("token'siz → 401", async () => {
      await registerUser(app, { username: 'aziz' });
      const res = await http().get('/api/v1/users/aziz');
      expect(res.status).toBe(401);
    });

    it("admin profili boshqa userga 404 (user-facing'da yashirin)", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const admin = await registerUser(app, { username: 'superadmin' });
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' },
      });

      const res = await http().get('/api/v1/users/superadmin').set(auth(me));
      expect(res.status).toBe(404);
    });

    it("admin o'z profilini ko'ra oladi (self)", async () => {
      const admin = await registerUser(app, { username: 'superadmin' });
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' },
      });

      const res = await http().get('/api/v1/users/superadmin').set(auth(admin));
      expect(res.status).toBe(200);
      expect(res.body.data.relationship).toBe('self');
    });
  });

  describe('GET /users/search', () => {
    it("username bo'yicha topadi (case-insensitive), xavfsiz shakl qaytaradi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      await registerUser(app, { username: 'boburshoh', fullName: 'Bobur' });

      const res = await http()
        .get('/api/v1/users/search?q=BOBUR')
        .set(auth(me));

      expect(res.status).toBe(200);
      const items = res.body.data.items;
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ username: 'boburshoh' });
      // maxfiy / ortiqcha maydonlar yo'q
      expect(items[0].email).toBeUndefined();
      expect(items[0].passwordHash).toBeUndefined();
      expect(res.body.data.nextCursor).toBeNull();
    });

    it("fullName bo'yicha ham topadi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      await registerUser(app, {
        username: 'xyz',
        fullName: 'Sardor Aliyev',
      });

      const res = await http()
        .get('/api/v1/users/search?q=sardor')
        .set(auth(me));

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].username).toBe('xyz');
    });

    it('bloklangan user qidiruvda chiqmaydi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const blocked = await registerUser(app, { username: 'badboy' });
      await prisma.user.update({
        where: { id: blocked.id },
        data: { isBlocked: true },
      });

      const res = await http()
        .get('/api/v1/users/search?q=badboy')
        .set(auth(me));

      expect(res.body.data.items).toHaveLength(0);
    });

    it('limit + nextCursor bilan sahifalaydi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      // bir nechta mos user (username prefix=match)
      for (const u of ['match_a', 'match_b', 'match_c']) {
        await registerUser(app, { username: u });
      }

      const first = await http()
        .get('/api/v1/users/search?q=match&limit=2')
        .set(auth(me));
      expect(first.body.data.items).toHaveLength(2);
      expect(first.body.data.nextCursor).toEqual(expect.any(String));

      const second = await http()
        .get(
          `/api/v1/users/search?q=match&limit=2&cursor=${encodeURIComponent(
            first.body.data.nextCursor,
          )}`,
        )
        .set(auth(me));
      expect(second.body.data.items).toHaveLength(1);
      expect(second.body.data.nextCursor).toBeNull();

      // sahifalar bir-birini takrorlamaydi
      const usernames = [
        ...first.body.data.items,
        ...second.body.data.items,
      ].map((i: { username: string }) => i.username);
      expect(new Set(usernames).size).toBe(3);
    });

    it("bo'sh q → 400 validatsiya", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http().get('/api/v1/users/search?q=').set(auth(me));
      expect(res.status).toBe(400);
    });

    it('admin user qidiruvda chiqmaydi (user-facing)', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const admin = await registerUser(app, { username: 'superadmin' });
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' },
      });

      const res = await http()
        .get('/api/v1/users/search?q=superadmin')
        .set(auth(me));
      expect(res.body.data.items).toHaveLength(0);
    });
  });

  describe('GET /users/:username/followers & /following', () => {
    it("public user → followers ro'yxati hammaga ko'rinadi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      const fan = await registerUser(app, { username: 'fan' });
      await prisma.follow.create({
        data: {
          followerId: fan.id,
          followingId: target.id,
          status: 'ACCEPTED',
        },
      });

      const res = await http()
        .get(`/api/v1/users/${target.username}/followers`)
        .set(auth(me));

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].username).toBe('fan');
    });

    it("public user → following ro'yxati", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      const idol = await registerUser(app, { username: 'idol' });
      await prisma.follow.create({
        data: {
          followerId: target.id,
          followingId: idol.id,
          status: 'ACCEPTED',
        },
      });

      const res = await http()
        .get(`/api/v1/users/${target.username}/following`)
        .set(auth(me));

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].username).toBe('idol');
    });

    it('private user, non-follower → 403', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: target.id },
        data: { isPrivate: true },
      });

      const res = await http()
        .get(`/api/v1/users/${target.username}/followers`)
        .set(auth(me));
      expect(res.status).toBe(403);
    });

    it("private user, tasdiqlangan follower → ro'yxat ko'rinadi", async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: target.id },
        data: { isPrivate: true },
      });
      await prisma.follow.create({
        data: { followerId: me.id, followingId: target.id, status: 'ACCEPTED' },
      });

      const res = await http()
        .get(`/api/v1/users/${target.username}/followers`)
        .set(auth(me));
      expect(res.status).toBe(200);
      // me o'zi follower
      expect(
        res.body.data.items.map((i: { username: string }) => i.username),
      ).toContain('aziz');
    });

    it("private user, egasi o'zi → ro'yxatni ko'radi", async () => {
      const target = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: target.id },
        data: { isPrivate: true },
      });

      const res = await http()
        .get(`/api/v1/users/${target.username}/following`)
        .set(auth(target));
      expect(res.status).toBe(200);
    });

    it('bloklangan user → 404', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      await prisma.user.update({
        where: { id: target.id },
        data: { isBlocked: true },
      });
      const res = await http()
        .get(`/api/v1/users/${target.username}/followers`)
        .set(auth(me));
      expect(res.status).toBe(404);
    });
  });
});
