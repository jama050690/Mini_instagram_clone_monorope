import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthedUser, createTestApp, registerUser, resetDb } from './helpers';

describe('Follow (e2e)', () => {
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

  async function makePrivate(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isPrivate: true } });
  }

  async function followerCount(
    username: string,
    viewer: AuthedUser,
  ): Promise<number> {
    const res = await http().get(`/api/v1/users/${username}`).set(auth(viewer));
    return res.body.data.counts.followers;
  }

  describe('POST /users/:username/follow', () => {
    it('public → ACCEPTED (following), followerCount oshadi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });

      const res = await http()
        .post('/api/v1/users/bobur/follow')
        .set(auth(me))
        .expect(200);
      expect(res.body.data.relationship).toBe('following');
      expect(await followerCount('bobur', target)).toBe(1);
    });

    it('private → PENDING (requested), countga kirmaydi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      await makePrivate(target.id);

      const res = await http()
        .post('/api/v1/users/bobur/follow')
        .set(auth(me))
        .expect(200);
      expect(res.body.data.relationship).toBe('requested');
      expect(await followerCount('bobur', target)).toBe(0);
    });

    it('idempotent — takror follow joriy holatni qaytaradi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      await registerUser(app, { username: 'bobur' });

      await http().post('/api/v1/users/bobur/follow').set(auth(me));
      const res = await http().post('/api/v1/users/bobur/follow').set(auth(me));
      expect(res.body.data.relationship).toBe('following');

      const count = await prisma.follow.count({
        where: { follower: { username: 'aziz' } },
      });
      expect(count).toBe(1);
    });

    it('self-follow → 400 SELF_FOLLOW', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http().post('/api/v1/users/aziz/follow').set(auth(me));
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SELF_FOLLOW');
    });

    it('mavjud bo`lmagan user → 404', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const res = await http()
        .post('/api/v1/users/nobody/follow')
        .set(auth(me));
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /users/:username/follow', () => {
    it('unfollow → none, followerCount kamayadi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      await http().post('/api/v1/users/bobur/follow').set(auth(me));

      const res = await http()
        .delete('/api/v1/users/bobur/follow')
        .set(auth(me))
        .expect(200);
      expect(res.body.data.relationship).toBe('none');
      expect(await followerCount('bobur', target)).toBe(0);
    });

    it('pending so`rovni bekor qiladi', async () => {
      const me = await registerUser(app, { username: 'aziz' });
      const target = await registerUser(app, { username: 'bobur' });
      await makePrivate(target.id);
      await http().post('/api/v1/users/bobur/follow').set(auth(me));

      await http()
        .delete('/api/v1/users/bobur/follow')
        .set(auth(me))
        .expect(200);
      const count = await prisma.follow.count({
        where: { following: { username: 'bobur' } },
      });
      expect(count).toBe(0);
    });
  });

  describe('GET /follow/requests + accept/reject', () => {
    async function sendRequest(
      from: string,
      to: AuthedUser,
    ): Promise<AuthedUser> {
      const requester = await registerUser(app, { username: from });
      await http()
        .post(`/api/v1/users/${to.username}/follow`)
        .set(auth(requester));
      return requester;
    }

    it('ro`yxat: kelgan pending so`rovlar', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      await makePrivate(owner.id);
      await sendRequest('aziz', owner);
      await sendRequest('bobur', owner);

      const res = await http().get('/api/v1/follow/requests').set(auth(owner));
      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      const usernames = res.body.data.items.map(
        (u: { username: string }) => u.username,
      );
      expect(usernames).toEqual(expect.arrayContaining(['aziz', 'bobur']));
    });

    it('accept → ACCEPTED, followerCount oshadi, so`rov yo`qoladi', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      await makePrivate(owner.id);
      const requester = await sendRequest('aziz', owner);

      await http()
        .post(`/api/v1/follow/requests/${requester.id}/accept`)
        .set(auth(owner))
        .expect(204);

      expect(await followerCount('owner', owner)).toBe(1);
      const reqs = await http().get('/api/v1/follow/requests').set(auth(owner));
      expect(reqs.body.data.items).toHaveLength(0);
    });

    it('reject → so`rov o`chadi, follower bo`lmaydi', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      await makePrivate(owner.id);
      const requester = await sendRequest('aziz', owner);

      await http()
        .post(`/api/v1/follow/requests/${requester.id}/reject`)
        .set(auth(owner))
        .expect(204);

      expect(await followerCount('owner', owner)).toBe(0);
      const count = await prisma.follow.count({
        where: { following: { username: 'owner' } },
      });
      expect(count).toBe(0);
    });

    it('mavjud bo`lmagan so`rovni accept → 404', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      const stranger = await registerUser(app, { username: 'stranger' });
      const res = await http()
        .post(`/api/v1/follow/requests/${stranger.id}/accept`)
        .set(auth(owner));
      expect(res.status).toBe(404);
    });
  });

  describe('Private→Public auto-accept (SRS 6.1)', () => {
    it('setPrivacy(false) → barcha pending ACCEPTED, count oshadi', async () => {
      const owner = await registerUser(app, { username: 'owner' });
      await makePrivate(owner.id);
      const aziz = await registerUser(app, { username: 'aziz' });
      const bobur = await registerUser(app, { username: 'bobur' });
      await http().post('/api/v1/users/owner/follow').set(auth(aziz));
      await http().post('/api/v1/users/owner/follow').set(auth(bobur));

      await http()
        .patch('/api/v1/profile/privacy')
        .set(auth(owner))
        .send({ isPrivate: false })
        .expect(200);

      expect(await followerCount('owner', owner)).toBe(2);
      const pending = await prisma.follow.count({
        where: { following: { username: 'owner' }, status: 'PENDING' },
      });
      expect(pending).toBe(0);
    });
  });
});
