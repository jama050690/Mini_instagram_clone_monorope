import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';

// Magic-byte'lar bo'yicha to'g'ri keladigan minimal fayl buferlari.
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const MP4 = Buffer.concat([
  Buffer.from([0, 0, 0, 0x18]),
  Buffer.from('ftypisom'),
]);
const NOT_MEDIA = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);

describe('Posts (e2e)', () => {
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

  /** Egasi nomidan post yaratadi (default: 1 jpg), javob body qaytaradi. */
  async function createPost(
    user: AuthedUser,
    files: { buf: Buffer; name: string; type: string }[] = [
      { buf: JPG, name: 'a.jpg', type: 'image/jpeg' },
    ],
    caption?: string,
  ): Promise<request.Response> {
    let req = http().post('/api/v1/posts').set(auth(user));
    if (caption !== undefined) req = req.field('caption', caption);
    for (const f of files) {
      req = req.attach('files', f.buf, {
        filename: f.name,
        contentType: f.type,
      });
    }
    return req;
  }

  describe('POST /posts', () => {
    it('1 rasm → 201, type IMAGE, media[0].url avtorizatsiyali', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await createPost(me, undefined, 'Salom');

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('IMAGE');
      expect(res.body.data.caption).toBe('Salom');
      expect(res.body.data.media).toHaveLength(1);
      expect(res.body.data.media[0].url).toMatch(/^\/api\/v1\/media\/.+/);
      expect(res.body.data.author.username).toBe('aziz');
      expect(res.body.data.likeCount).toBe(0);
      expect(res.body.data.commentCount).toBe(0);
      expect(res.body.data.likedByMe).toBe(false);
    });

    it('2 rasm → CAROUSEL, media order 0,1', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await createPost(me, [
        { buf: JPG, name: 'a.jpg', type: 'image/jpeg' },
        { buf: PNG, name: 'b.png', type: 'image/png' },
      ]);

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('CAROUSEL');
      expect(
        res.body.data.media.map((m: { order: number }) => m.order),
      ).toEqual([0, 1]);
    });

    it('1 video → VIDEO', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await createPost(me, [
        { buf: MP4, name: 'v.mp4', type: 'video/mp4' },
      ]);

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('VIDEO');
      expect(res.body.data.media[0].kind).toBe('VIDEO');
    });

    it('rasm + video aralash → 400 MIXED_MEDIA', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await createPost(me, [
        { buf: JPG, name: 'a.jpg', type: 'image/jpeg' },
        { buf: MP4, name: 'v.mp4', type: 'video/mp4' },
      ]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MIXED_MEDIA');
    });

    it('2 video → 400 INVALID_MEDIA_COUNT', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await createPost(me, [
        { buf: MP4, name: 'v1.mp4', type: 'video/mp4' },
        { buf: MP4, name: 'v2.mp4', type: 'video/mp4' },
      ]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_MEDIA_COUNT');
    });

    it('fayl yo`q → 400 INVALID_MEDIA_COUNT', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http()
        .post('/api/v1/posts')
        .set(auth(me))
        .field('caption', 'faqat matn');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_MEDIA_COUNT');
    });

    it('noto`g`ri fayl turi → 400 INVALID_FILE_TYPE', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await createPost(me, [
        { buf: NOT_MEDIA, name: 'x.bin', type: 'application/octet-stream' },
      ]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('caption 2200 dan uzun → 400 (validation)', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await createPost(me, undefined, 'a'.repeat(2201));

      expect(res.status).toBe(400);
    });

    it('autentifikatsiyasiz → 401', async () => {
      const res = await http()
        .post('/api/v1/posts')
        .attach('files', JPG, { filename: 'a.jpg', contentType: 'image/jpeg' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /posts/:id', () => {
    it('egasi o`z postini ko`radi → 200', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const created = await createPost(me);
      const res = await http()
        .get(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(me));
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(created.body.data.id);
    });

    it('public post boshqa userga ko`rinadi → 200', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const viewer = await registerUser(app, { username: 'viewer' });
      const created = await createPost(owner);
      const res = await http()
        .get(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(viewer));
      expect(res.status).toBe(200);
    });

    it('private post, non-follower → 403', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const viewer = await registerUser(app, { username: 'viewer' });
      const created = await createPost(owner);
      await prisma.user.update({
        where: { id: owner.id },
        data: { isPrivate: true },
      });

      const res = await http()
        .get(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(viewer));
      expect(res.status).toBe(403);
    });

    it('private post, ACCEPTED follower → 200', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const viewer = await registerUser(app, { username: 'viewer' });
      const created = await createPost(owner);
      await prisma.user.update({
        where: { id: owner.id },
        data: { isPrivate: true },
      });
      await prisma.follow.create({
        data: {
          followerId: viewer.id,
          followingId: owner.id,
          status: 'ACCEPTED',
        },
      });

      const res = await http()
        .get(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(viewer));
      expect(res.status).toBe(200);
    });

    it('mavjud bo`lmagan post → 404', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http().get('/api/v1/posts/nope').set(auth(me));
      expect(res.status).toBe(404);
    });
  });

  describe('GET /users/:username/posts', () => {
    it('grid: cursor pagination (3 post, limit 2)', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      await createPost(me);
      await createPost(me);
      await createPost(me);

      const p1 = await http()
        .get('/api/v1/users/aziz/posts?limit=2')
        .set(auth(me));
      expect(p1.status).toBe(200);
      expect(p1.body.data.items).toHaveLength(2);
      expect(p1.body.data.nextCursor).toBeTruthy();

      const p2 = await http()
        .get(
          `/api/v1/users/aziz/posts?limit=2&cursor=${p1.body.data.nextCursor}`,
        )
        .set(auth(me));
      expect(p2.body.data.items).toHaveLength(1);
      expect(p2.body.data.nextCursor).toBeNull();
    });

    it('o`chirilgan post grid`da chiqmaydi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const created = await createPost(me);
      await http()
        .delete(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(me));

      const res = await http().get('/api/v1/users/aziz/posts').set(auth(me));
      expect(res.body.data.items).toHaveLength(0);
    });

    it('private user grid, non-follower → 403', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const viewer = await registerUser(app, { username: 'viewer' });
      await createPost(owner);
      await prisma.user.update({
        where: { id: owner.id },
        data: { isPrivate: true },
      });

      const res = await http()
        .get('/api/v1/users/owner/posts')
        .set(auth(viewer));
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /posts/:id', () => {
    it('egasi caption tahrirlaydi → 200', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const created = await createPost(me, undefined, 'eski');

      const res = await http()
        .patch(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(me))
        .send({ caption: 'yangi' });
      expect(res.status).toBe(200);
      expect(res.body.data.caption).toBe('yangi');
    });

    it('bo`sh caption → tozalanadi (null)', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const created = await createPost(me, undefined, 'eski');

      const res = await http()
        .patch(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(me))
        .send({ caption: '' });
      expect(res.body.data.caption).toBe('');
    });

    it('egasi bo`lmagan user → 403', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const other = await registerUser(app, { username: 'other' });
      const created = await createPost(owner);

      const res = await http()
        .patch(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(other))
        .send({ caption: 'hack' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('egasi o`chiradi → 204, keyin GET → 404', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const created = await createPost(me);

      const del = await http()
        .delete(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(me));
      expect(del.status).toBe(204);

      const get = await http()
        .get(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(me));
      expect(get.status).toBe(404);

      // Soft delete: yozuv qoladi, deletedAt o'rnatiladi.
      const row = await prisma.post.findUnique({
        where: { id: created.body.data.id },
      });
      expect(row?.deletedAt).not.toBeNull();
    });

    it('admin boshqa userning postini o`chiradi → 204', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const admin = await registerUser(app, { username: 'superadmin' });
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' },
      });
      const created = await createPost(owner);

      const del = await http()
        .delete(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(admin));
      expect(del.status).toBe(204);
    });

    it('egasi/admin bo`lmagan user → 403', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const other = await registerUser(app, { username: 'other' });
      const created = await createPost(owner);

      const del = await http()
        .delete(`/api/v1/posts/${created.body.data.id}`)
        .set(auth(other));
      expect(del.status).toBe(403);
    });
  });
});
