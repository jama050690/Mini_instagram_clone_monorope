import { INestApplication } from '@nestjs/common';
import { PostType } from '@prisma/client';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';

describe('Engagement (e2e)', () => {
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

  /** To'g'ridan-to'g'ri DB'da public post yaratadi (media'siz, engagement uchun yetarli). */
  async function makePost(authorId: string): Promise<string> {
    const post = await prisma.post.create({
      data: { authorId, type: PostType.IMAGE },
    });
    return post.id;
  }

  describe('POST/DELETE /posts/:id/like', () => {
    it('like idempotent → likeCount 1, likedByMe true', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const postId = await makePost(me.id);

      await http()
        .post(`/api/v1/posts/${postId}/like`)
        .set(auth(me))
        .expect(200);
      const res = await http()
        .post(`/api/v1/posts/${postId}/like`)
        .set(auth(me))
        .expect(200);

      expect(res.body.data.likeCount).toBe(1);
      expect(res.body.data.likedByMe).toBe(true);
    });

    it('unlike → likeCount 0, likedByMe false', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const postId = await makePost(me.id);
      await http().post(`/api/v1/posts/${postId}/like`).set(auth(me));

      const res = await http()
        .delete(`/api/v1/posts/${postId}/like`)
        .set(auth(me))
        .expect(200);

      expect(res.body.data.likeCount).toBe(0);
      expect(res.body.data.likedByMe).toBe(false);
    });

    it('private post, non-follower like → 403', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const viewer = await registerUser(app, { username: 'viewer' });
      const postId = await makePost(owner.id);
      await prisma.user.update({
        where: { id: owner.id },
        data: { isPrivate: true },
      });

      const res = await http()
        .post(`/api/v1/posts/${postId}/like`)
        .set(auth(viewer));
      expect(res.status).toBe(403);
    });

    it('o`chirilgan post like → 404', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const postId = await makePost(me.id);
      await prisma.post.update({
        where: { id: postId },
        data: { deletedAt: new Date() },
      });

      const res = await http()
        .post(`/api/v1/posts/${postId}/like`)
        .set(auth(me));
      expect(res.status).toBe(404);
    });
  });

  describe('POST/GET /posts/:id/comments', () => {
    it('izoh qo`shish → 201 + commentCount oshadi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const postId = await makePost(me.id);

      const res = await http()
        .post(`/api/v1/posts/${postId}/comments`)
        .set(auth(me))
        .send({ text: 'Zo`r post!' });
      expect(res.status).toBe(201);
      expect(res.body.data.text).toBe('Zo`r post!');
      expect(res.body.data.author.username).toBe('aziz');

      const post = await http().get(`/api/v1/posts/${postId}`).set(auth(me));
      expect(post.body.data.commentCount).toBe(1);
    });

    it('bo`sh text → 400', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const postId = await makePost(me.id);

      const res = await http()
        .post(`/api/v1/posts/${postId}/comments`)
        .set(auth(me))
        .send({ text: '' });
      expect(res.status).toBe(400);
    });

    it('1000 dan uzun text → 400', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const postId = await makePost(me.id);

      const res = await http()
        .post(`/api/v1/posts/${postId}/comments`)
        .set(auth(me))
        .send({ text: 'a'.repeat(1001) });
      expect(res.status).toBe(400);
    });

    it('ro`yxat: cursor pagination (3 izoh, limit 2)', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const postId = await makePost(me.id);
      for (const t of ['bir', 'ikki', 'uch']) {
        await http()
          .post(`/api/v1/posts/${postId}/comments`)
          .set(auth(me))
          .send({ text: t });
      }

      const p1 = await http()
        .get(`/api/v1/posts/${postId}/comments?limit=2`)
        .set(auth(me));
      expect(p1.body.data.items).toHaveLength(2);
      expect(p1.body.data.nextCursor).toBeTruthy();

      const p2 = await http()
        .get(
          `/api/v1/posts/${postId}/comments?limit=2&cursor=${p1.body.data.nextCursor}`,
        )
        .set(auth(me));
      expect(p2.body.data.items).toHaveLength(1);
      expect(p2.body.data.nextCursor).toBeNull();
    });

    it('private post, non-follower izoh → 403', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const viewer = await registerUser(app, { username: 'viewer' });
      const postId = await makePost(owner.id);
      await prisma.user.update({
        where: { id: owner.id },
        data: { isPrivate: true },
      });

      const res = await http()
        .post(`/api/v1/posts/${postId}/comments`)
        .set(auth(viewer))
        .send({ text: 'salom' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /comments/:id', () => {
    async function addComment(
      postId: string,
      user: AuthedUser,
    ): Promise<string> {
      const res = await http()
        .post(`/api/v1/posts/${postId}/comments`)
        .set(auth(user))
        .send({ text: 'izoh' });
      return res.body.data.id;
    }

    it('izoh egasi o`chiradi → 204', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const postId = await makePost(owner.id);
      const commentId = await addComment(postId, commenter);

      const res = await http()
        .delete(`/api/v1/comments/${commentId}`)
        .set(auth(commenter));
      expect(res.status).toBe(204);
    });

    it('post egasi boshqaning izohini o`chiradi → 204', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const postId = await makePost(owner.id);
      const commentId = await addComment(postId, commenter);

      const res = await http()
        .delete(`/api/v1/comments/${commentId}`)
        .set(auth(owner));
      expect(res.status).toBe(204);
    });

    it('admin har qanday izohni o`chiradi → 204', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const admin = await registerUser(app, { username: 'superadmin' });
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' },
      });
      const postId = await makePost(owner.id);
      const commentId = await addComment(postId, commenter);

      const res = await http()
        .delete(`/api/v1/comments/${commentId}`)
        .set(auth(admin));
      expect(res.status).toBe(204);
    });

    it('begona user izohni o`chira olmaydi → 403', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const commenter = await registerUser(app, { username: 'commenter' });
      const other = await registerUser(app, { username: 'other' });
      const postId = await makePost(owner.id);
      const commentId = await addComment(postId, commenter);

      const res = await http()
        .delete(`/api/v1/comments/${commentId}`)
        .set(auth(other));
      expect(res.status).toBe(403);
    });
  });
});
