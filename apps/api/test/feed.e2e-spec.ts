import { INestApplication } from '@nestjs/common';
import { PostType } from '@prisma/client';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';

describe('Feed (e2e)', () => {
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

  async function makePost(authorId: string): Promise<string> {
    const post = await prisma.post.create({
      data: { authorId, type: PostType.IMAGE },
    });
    return post.id;
  }

  async function makePrivate(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isPrivate: true } });
  }

  describe('GET /feed — primary', () => {
    it('follow qilingan + o`zining postlari (boshqalar yo`q), isFallback false', async () => {
      const me = await registerUser(app, { username: 'mike' });
      const alice = await registerUser(app, { username: 'alice' });
      const bob = await registerUser(app, { username: 'bob' });
      await http().post('/api/v1/users/alice/follow').set(auth(me));

      await makePost(alice.id);
      await makePost(bob.id);
      await makePost(me.id);

      const res = await http().get('/api/v1/feed').set(auth(me));
      expect(res.status).toBe(200);
      expect(res.body.data.isFallback).toBe(false);

      const usernames = res.body.data.items.map(
        (p: { author: { username: string } }) => p.author.username,
      );
      expect(usernames).toEqual(expect.arrayContaining(['mike', 'alice']));
      expect(usernames).not.toContain('bob');
    });

    it('yangi → eski tartib + cursor pagination', async () => {
      const me = await registerUser(app, { username: 'mike' });
      await makePost(me.id);
      await makePost(me.id);
      await makePost(me.id);

      const p1 = await http().get('/api/v1/feed?limit=2').set(auth(me));
      expect(p1.body.data.items).toHaveLength(2);
      expect(p1.body.data.nextCursor).toBeTruthy();

      const p2 = await http()
        .get(`/api/v1/feed?limit=2&cursor=${p1.body.data.nextCursor}`)
        .set(auth(me));
      expect(p2.body.data.items).toHaveLength(1);
      expect(p2.body.data.nextCursor).toBeNull();
    });

    it('o`chirilgan post feed`da chiqmaydi', async () => {
      const me = await registerUser(app, { username: 'mike' });
      const live = await makePost(me.id);
      const dead = await makePost(me.id);
      await prisma.post.update({
        where: { id: dead },
        data: { deletedAt: new Date() },
      });

      const res = await http().get('/api/v1/feed').set(auth(me));
      const ids = res.body.data.items.map((p: { id: string }) => p.id);
      expect(ids).toContain(live);
      expect(ids).not.toContain(dead);
    });
  });

  describe('GET /feed — fallback (bo`sh)', () => {
    it('follow/post yo`q → so`nggi public postlar, isFallback true', async () => {
      const me = await registerUser(app, { username: 'mike' });
      const alice = await registerUser(app, { username: 'alice' });
      const carol = await registerUser(app, { username: 'carol' });
      await makePrivate(carol.id);
      await makePost(alice.id);
      await makePost(carol.id);

      const res = await http().get('/api/v1/feed').set(auth(me));
      expect(res.body.data.isFallback).toBe(true);
      const usernames = res.body.data.items.map(
        (p: { author: { username: string } }) => p.author.username,
      );
      expect(usernames).toContain('alice');
      expect(usernames).not.toContain('carol');
    });
  });

  describe('GET /users/suggested', () => {
    it('follow qilinmagan public profillar (self/followed/private/admin yo`q)', async () => {
      const me = await registerUser(app, { username: 'mike' });
      await registerUser(app, { username: 'alice' });
      await registerUser(app, { username: 'bob' });
      const carol = await registerUser(app, { username: 'carol' });
      const admin = await registerUser(app, { username: 'superadmin' });
      await makePrivate(carol.id);
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' },
      });
      await http().post('/api/v1/users/bob/follow').set(auth(me));

      const res = await http().get('/api/v1/users/suggested').set(auth(me));
      expect(res.status).toBe(200);
      const usernames = res.body.data.map(
        (u: { username: string }) => u.username,
      );
      expect(usernames).toContain('alice');
      expect(usernames).not.toContain('bob'); // followed
      expect(usernames).not.toContain('carol'); // private
      expect(usernames).not.toContain('superadmin'); // admin
      expect(usernames).not.toContain('mike'); // self
    });
  });
});
