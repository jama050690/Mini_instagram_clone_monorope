import { FollowStatus, Role, User } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { VisibilityService } from './visibility.service';

function makeService(over: {
  user?: Partial<User> | null;
  follow?: { status: FollowStatus } | null;
}): VisibilityService {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(over.user ?? null) },
    follow: { findUnique: jest.fn().mockResolvedValue(over.follow ?? null) },
  } as unknown as PrismaService;
  return new VisibilityService(prisma);
}

const VIEWER = { id: 'me', role: Role.USER } as User;

describe('VisibilityService', () => {
  describe('hiddenFromViewer', () => {
    const svc = makeService({});
    it('bloklangan (boshqaga) → yashirin', () => {
      expect(
        svc.hiddenFromViewer(
          { id: 'x', isBlocked: true, role: Role.USER },
          'me',
        ),
      ).toBe(true);
    });
    it('admin (boshqaga) → yashirin', () => {
      expect(
        svc.hiddenFromViewer(
          { id: 'x', isBlocked: false, role: Role.ADMIN },
          'me',
        ),
      ).toBe(true);
    });
    it('o`zi (admin bo`lsa ham) → ko`rinadi', () => {
      expect(
        svc.hiddenFromViewer(
          { id: 'me', isBlocked: true, role: Role.ADMIN },
          'me',
        ),
      ).toBe(false);
    });
  });

  describe('resolveVisibleUser', () => {
    it('yo`q → 404', async () => {
      await expect(
        makeService({ user: null }).resolveVisibleUser('nope', VIEWER),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
    it('bloklangan → 404', async () => {
      await expect(
        makeService({
          user: { id: 'x', isBlocked: true, role: Role.USER },
        }).resolveVisibleUser('x', VIEWER),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
    it('ko`rinadigan → user qaytadi', async () => {
      const user = { id: 'x', isBlocked: false, role: Role.USER } as User;
      await expect(
        makeService({ user }).resolveVisibleUser('x', VIEWER),
      ).resolves.toBe(user);
    });
  });

  describe('assertCanViewContent', () => {
    it('public author → ruxsat', async () => {
      await expect(
        makeService({}).assertCanViewContent('me', {
          id: 'x',
          isPrivate: false,
        }),
      ).resolves.toBeUndefined();
    });
    it('o`zi (private bo`lsa ham) → ruxsat', async () => {
      await expect(
        makeService({}).assertCanViewContent('me', {
          id: 'me',
          isPrivate: true,
        }),
      ).resolves.toBeUndefined();
    });
    it('private + ACCEPTED follower → ruxsat', async () => {
      await expect(
        makeService({
          follow: { status: FollowStatus.ACCEPTED },
        }).assertCanViewContent('me', { id: 'x', isPrivate: true }),
      ).resolves.toBeUndefined();
    });
    it('private + non-follower → 403', async () => {
      await expect(
        makeService({ follow: null }).assertCanViewContent('me', {
          id: 'x',
          isPrivate: true,
        }),
      ).rejects.toBeInstanceOf(AppException);
    });
    it('private + PENDING (faqat so`rov) → 403', async () => {
      await expect(
        makeService({
          follow: { status: FollowStatus.PENDING },
        }).assertCanViewContent('me', { id: 'x', isPrivate: true }),
      ).rejects.toBeInstanceOf(AppException);
    });
  });

  describe('relationship', () => {
    it('o`zi → self', async () => {
      await expect(makeService({}).relationship('me', 'me')).resolves.toBe(
        'self',
      );
    });
    it('yozuv yo`q → none', async () => {
      await expect(
        makeService({ follow: null }).relationship('me', 'x'),
      ).resolves.toBe('none');
    });
    it('ACCEPTED → following', async () => {
      await expect(
        makeService({ follow: { status: FollowStatus.ACCEPTED } }).relationship(
          'me',
          'x',
        ),
      ).resolves.toBe('following');
    });
    it('PENDING → requested', async () => {
      await expect(
        makeService({ follow: { status: FollowStatus.PENDING } }).relationship(
          'me',
          'x',
        ),
      ).resolves.toBe('requested');
    });
  });
});
