import { INestApplication } from '@nestjs/common';
import { PostType, PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as request from 'supertest';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? 'uploads');

/** Egasiga tegishli post + bitta media yozuvi + diskdagi fayl yaratadi. */
async function createPostMedia(
  prisma: PrismaClient,
  authorId: string,
  body = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6]),
): Promise<{ mediaId: string; postId: string }> {
  const post = await prisma.post.create({
    data: { authorId, type: PostType.IMAGE },
  });
  const media = await prisma.media.create({
    data: {
      postId: post.id,
      kind: 'IMAGE',
      path: `posts/${post.id}/m.jpg`,
      sizeBytes: body.length,
      mimeType: 'image/jpeg',
    },
  });
  const dir = path.join(UPLOAD_DIR, 'posts', post.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'm.jpg'), body);
  return { mediaId: media.id, postId: post.id };
}

describe('Media serving (e2e)', () => {
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

  it('egasi o`z post mediasini oqitadi → 200 + to`g`ri Content-Type', async () => {
    const me = await registerUser(app, { username: 'aziz' });
    const { mediaId } = await createPostMedia(prisma, me.id);

    const res = await http().get(`/api/v1/media/${mediaId}`).set(auth(me));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/jpeg');
    expect(res.headers['accept-ranges']).toBe('bytes');
    expect(res.body.length).toBe(10);
  });

  it('public post mediasi har qanday autentifikatsiyalangan userga ko`rinadi', async () => {
    const owner = await registerUser(app, { username: 'owner' });
    const viewer = await registerUser(app, { username: 'viewer' });
    const { mediaId } = await createPostMedia(prisma, owner.id);

    const res = await http().get(`/api/v1/media/${mediaId}`).set(auth(viewer));
    expect(res.status).toBe(200);
  });

  it('private post, non-follower → 403', async () => {
    const owner = await registerUser(app, { username: 'owner' });
    const viewer = await registerUser(app, { username: 'viewer' });
    await prisma.user.update({
      where: { id: owner.id },
      data: { isPrivate: true },
    });
    const { mediaId } = await createPostMedia(prisma, owner.id);

    const res = await http().get(`/api/v1/media/${mediaId}`).set(auth(viewer));
    expect(res.status).toBe(403);
  });

  it('private post, tasdiqlangan follower → 200', async () => {
    const owner = await registerUser(app, { username: 'owner' });
    const viewer = await registerUser(app, { username: 'viewer' });
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
    const { mediaId } = await createPostMedia(prisma, owner.id);

    const res = await http().get(`/api/v1/media/${mediaId}`).set(auth(viewer));
    expect(res.status).toBe(200);
  });

  it('o`chirilgan post (deletedAt) mediasi → 404', async () => {
    const me = await registerUser(app, { username: 'aziz' });
    const { mediaId, postId } = await createPostMedia(prisma, me.id);
    await prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    const res = await http().get(`/api/v1/media/${mediaId}`).set(auth(me));
    expect(res.status).toBe(404);
  });

  it('mavjud bo`lmagan media → 404', async () => {
    const me = await registerUser(app, { username: 'aziz' });
    const res = await http().get('/api/v1/media/yoq123').set(auth(me));
    expect(res.status).toBe(404);
  });

  it('Range so`rovi → 206 + Content-Range + qisman tana', async () => {
    const me = await registerUser(app, { username: 'aziz' });
    const { mediaId } = await createPostMedia(prisma, me.id);

    const res = await http()
      .get(`/api/v1/media/${mediaId}`)
      .set(auth(me))
      .set('Range', 'bytes=0-3');

    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toBe('bytes 0-3/10');
    expect(res.headers['content-length']).toBe('4');
    expect(res.body.length).toBe(4);
  });

  it('token`siz → 401', async () => {
    const me = await registerUser(app, { username: 'aziz' });
    const { mediaId } = await createPostMedia(prisma, me.id);
    const res = await http().get(`/api/v1/media/${mediaId}`);
    expect(res.status).toBe(401);
  });
});
