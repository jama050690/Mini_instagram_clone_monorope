import { INestApplication } from '@nestjs/common';
import { PostType } from '@prisma/client';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';

describe('Admin (e2e)', () => {
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

  async function makeAdmin(username: string): Promise<AuthedUser> {
    const u = await registerUser(app, { username });
    await prisma.user.update({ where: { id: u.id }, data: { role: 'ADMIN' } });
    return u;
  }

  async function makePost(authorId: string): Promise<string> {
    const post = await prisma.post.create({
      data: { authorId, type: PostType.IMAGE },
    });
    return post.id;
  }

  describe('RolesGuard', () => {
    it('oddiy user /admin/* → 403', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http().get('/api/v1/admin/stats').set(auth(me));
      expect(res.status).toBe(403);
    });

    it('autentifikatsiyasiz → 401', async () => {
      const res = await http().get('/api/v1/admin/stats');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /admin/stats', () => {
    it('statistika qaytaradi', async () => {
      const admin = await makeAdmin('superadmin');
      const bob = await registerUser(app, { username: 'bob' });
      await makePost(bob.id);

      const res = await http().get('/api/v1/admin/stats').set(auth(admin));
      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBe(2);
      expect(res.body.data.totalPosts).toBe(1);
      expect(res.body.data).toHaveProperty('blockedUsers');
      expect(res.body.data).toHaveProperty('newUsers7d');
    });
  });

  describe('GET /admin/users', () => {
    it('barcha userlar (bloklangan ham), qidiruv', async () => {
      const admin = await makeAdmin('superadmin');
      const bob = await registerUser(app, { username: 'bob' });
      await prisma.user.update({
        where: { id: bob.id },
        data: { isBlocked: true },
      });

      const all = await http().get('/api/v1/admin/users').set(auth(admin));
      const usernames = all.body.data.items.map(
        (u: { username: string }) => u.username,
      );
      expect(usernames).toEqual(expect.arrayContaining(['superadmin', 'bob']));

      const search = await http()
        .get('/api/v1/admin/users?search=bob')
        .set(auth(admin));
      expect(search.body.data.items).toHaveLength(1);
      expect(search.body.data.items[0].isBlocked).toBe(true);
    });
  });

  describe('block / unblock', () => {
    it('block → isBlocked true; bloklangan user 403, boshqalarga 404', async () => {
      const admin = await makeAdmin('superadmin');
      const bob = await registerUser(app, { username: 'bob' });
      const viewer = await registerUser(app, { username: 'aziz' });

      const blocked = await http()
        .patch(`/api/v1/admin/users/${bob.id}/block`)
        .set(auth(admin));
      expect(blocked.status).toBe(200);
      expect(blocked.body.data.isBlocked).toBe(true);

      // Bloklangan user himoyalangan endpointga kira olmaydi.
      const bobTry = await http().get('/api/v1/users/aziz').set(auth(bob));
      expect(bobTry.status).toBe(403);

      // Boshqalarga bob profili ko'rinmaydi.
      const hidden = await http().get('/api/v1/users/bob').set(auth(viewer));
      expect(hidden.status).toBe(404);
    });

    it('unblock → user qaytadi', async () => {
      const admin = await makeAdmin('superadmin');
      const bob = await registerUser(app, { username: 'bob' });
      await http()
        .patch(`/api/v1/admin/users/${bob.id}/block`)
        .set(auth(admin));

      const res = await http()
        .patch(`/api/v1/admin/users/${bob.id}/unblock`)
        .set(auth(admin));
      expect(res.body.data.isBlocked).toBe(false);

      const bobOk = await http().get('/api/v1/users/bob').set(auth(bob));
      expect(bobOk.status).toBe(200);
    });

    it('admin o`zini bloklay olmaydi → 400', async () => {
      const admin = await makeAdmin('superadmin');
      const res = await http()
        .patch(`/api/v1/admin/users/${admin.id}/block`)
        .set(auth(admin));
      expect(res.status).toBe(400);
    });

    it('mavjud bo`lmagan user block → 404', async () => {
      const admin = await makeAdmin('superadmin');
      const res = await http()
        .patch('/api/v1/admin/users/nope/block')
        .set(auth(admin));
      expect(res.status).toBe(404);
    });
  });

  describe('moderation', () => {
    it('admin postni o`chiradi → 204, soft delete', async () => {
      const admin = await makeAdmin('superadmin');
      const bob = await registerUser(app, { username: 'bob' });
      const postId = await makePost(bob.id);

      await http()
        .delete(`/api/v1/admin/posts/${postId}`)
        .set(auth(admin))
        .expect(204);

      const row = await prisma.post.findUnique({ where: { id: postId } });
      expect(row?.deletedAt).not.toBeNull();
    });

    it('admin izohni o`chiradi → 204', async () => {
      const admin = await makeAdmin('superadmin');
      const bob = await registerUser(app, { username: 'bob' });
      const postId = await makePost(bob.id);
      const comment = await prisma.comment.create({
        data: { postId, authorId: bob.id, text: 'salom' },
      });

      await http()
        .delete(`/api/v1/admin/comments/${comment.id}`)
        .set(auth(admin))
        .expect(204);

      const row = await prisma.comment.findUnique({
        where: { id: comment.id },
      });
      expect(row?.deletedAt).not.toBeNull();
    });
  });
});
