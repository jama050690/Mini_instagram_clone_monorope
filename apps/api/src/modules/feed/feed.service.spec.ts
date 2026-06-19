import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedService } from './feed.service';

const VIEWER = { id: 'me' } as User;

/** postIncludeFor uchun minimal post (toPostView talab qiladigan maydonlar). */
function fakePostRow(id: string) {
  return {
    id,
    author: { id: 'a', username: 'a', avatarUrl: null },
    caption: null,
    type: 'IMAGE',
    media: [],
    _count: { likes: 0, comments: 0 },
    likes: [],
    createdAt: new Date(0),
  };
}

describe('FeedService.getFeed — isFallback', () => {
  function makeService(hasPrimaryRow: boolean): {
    service: FeedService;
    findMany: jest.Mock;
  } {
    const findMany = jest.fn().mockResolvedValue([fakePostRow('p1')]);
    const prisma = {
      follow: { findMany: jest.fn().mockResolvedValue([]) },
      post: {
        findFirst: jest
          .fn()
          .mockResolvedValue(hasPrimaryRow ? { id: 'x' } : null),
        findMany,
      },
    } as unknown as PrismaService;
    return { service: new FeedService(prisma), findMany };
  }

  it('primary post mavjud → isFallback false', async () => {
    const { service } = makeService(true);
    const res = await service.getFeed(VIEWER);
    expect(res.isFallback).toBe(false);
    expect(res.items).toHaveLength(1);
  });

  it('primary bo`sh → isFallback true (fallback public postlar)', async () => {
    const { service } = makeService(false);
    const res = await service.getFeed(VIEWER);
    expect(res.isFallback).toBe(true);
  });
});
