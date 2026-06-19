import { Role, User } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import { EngagementService } from './engagement.service';

const USER = (id: string, role: Role = Role.USER) => ({ id, role }) as User;

describe('EngagementService', () => {
  function makeService(
    prisma: Partial<PrismaService>,
    posts: Partial<PostsService>,
  ): EngagementService {
    return new EngagementService(
      prisma as PrismaService,
      posts as PostsService,
    );
  }

  describe('like — maxfiylik mutatsiyadan oldin', () => {
    it('ko`rinmas post → upsert chaqirilmaydi', async () => {
      const upsert = jest.fn();
      const posts = {
        assertViewablePost: jest
          .fn()
          .mockRejectedValue(AppException.forbidden()),
      };
      const service = makeService(
        { like: { upsert } } as unknown as PrismaService,
        posts,
      );

      await expect(service.like('p1', USER('u1'))).rejects.toBeInstanceOf(
        AppException,
      );
      expect(upsert).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment — ruxsat', () => {
    function serviceWithComment(comment: unknown) {
      const update = jest.fn().mockResolvedValue({});
      const prisma = {
        comment: {
          findUnique: jest.fn().mockResolvedValue(comment),
          update,
        },
      } as unknown as PrismaService;
      return { service: makeService(prisma, {}), update };
    }

    const base = {
      id: 'c1',
      authorId: 'commenter',
      deletedAt: null,
      post: { authorId: 'owner', deletedAt: null },
    };

    it('izoh egasi → o`chadi', async () => {
      const { service, update } = serviceWithComment(base);
      await service.deleteComment('c1', USER('commenter'));
      expect(update).toHaveBeenCalled();
    });

    it('post egasi → o`chadi', async () => {
      const { service, update } = serviceWithComment(base);
      await service.deleteComment('c1', USER('owner'));
      expect(update).toHaveBeenCalled();
    });

    it('admin → o`chadi', async () => {
      const { service, update } = serviceWithComment(base);
      await service.deleteComment('c1', USER('admin', Role.ADMIN));
      expect(update).toHaveBeenCalled();
    });

    it('begona user → 403, o`chmaydi', async () => {
      const { service, update } = serviceWithComment(base);
      await expect(
        service.deleteComment('c1', USER('stranger')),
      ).rejects.toBeInstanceOf(AppException);
      expect(update).not.toHaveBeenCalled();
    });

    it('post o`chirilgan → 404', async () => {
      const { service } = serviceWithComment({
        ...base,
        post: { authorId: 'owner', deletedAt: new Date() },
      });
      await expect(
        service.deleteComment('c1', USER('commenter')),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
