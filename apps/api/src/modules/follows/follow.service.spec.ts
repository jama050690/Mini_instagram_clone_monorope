import { FollowStatus, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VisibilityService } from '../visibility/visibility.service';
import { FollowService } from './follow.service';

const ME = { id: 'me', role: Role.USER } as User;

function targetUser(over: Partial<User> = {}): User {
  return {
    id: 't1',
    username: 'bobur',
    isPrivate: false,
    isBlocked: false,
    role: Role.USER,
    ...over,
  } as User;
}

describe('FollowService.follow', () => {
  function makeService(over: {
    target?: User | null;
    existing?: { status: FollowStatus } | null;
    create?: jest.Mock;
  }): { service: FollowService; create: jest.Mock } {
    const create = over.create ?? jest.fn().mockResolvedValue({});
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(over.target ?? null) },
      follow: {
        findUnique: jest.fn().mockResolvedValue(over.existing ?? null),
        create,
      },
    } as unknown as PrismaService;
    // resolveTarget VisibilityService orqali — mock prisma'dan foydalanadi.
    const service = new FollowService(prisma, new VisibilityService(prisma));
    return { service, create };
  }

  it('public target → ACCEPTED (following)', async () => {
    const { service, create } = makeService({ target: targetUser() });
    const res = await service.follow(ME, 'bobur');
    expect(res.relationship).toBe('following');
    expect(create).toHaveBeenCalledWith({
      data: {
        followerId: 'me',
        followingId: 't1',
        status: FollowStatus.ACCEPTED,
      },
    });
  });

  it('private target → PENDING (requested)', async () => {
    const { service, create } = makeService({
      target: targetUser({ isPrivate: true }),
    });
    const res = await service.follow(ME, 'bobur');
    expect(res.relationship).toBe('requested');
    expect(create).toHaveBeenCalledWith({
      data: {
        followerId: 'me',
        followingId: 't1',
        status: FollowStatus.PENDING,
      },
    });
  });

  it('mavjud yozuv → idempotent, create chaqirilmaydi', async () => {
    const { service, create } = makeService({
      target: targetUser({ isPrivate: true }),
      existing: { status: FollowStatus.PENDING },
    });
    const res = await service.follow(ME, 'bobur');
    expect(res.relationship).toBe('requested');
    expect(create).not.toHaveBeenCalled();
  });

  it('self-follow → SELF_FOLLOW, create chaqirilmaydi', async () => {
    const { service, create } = makeService({
      target: { ...targetUser(), id: 'me' },
    });
    await expect(service.follow(ME, 'bobur')).rejects.toMatchObject({
      code: 'SELF_FOLLOW',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('target yo`q → 404', async () => {
    const { service } = makeService({ target: null });
    await expect(service.follow(ME, 'nobody')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
