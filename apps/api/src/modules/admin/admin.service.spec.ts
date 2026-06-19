import { PrismaService } from '../../prisma/prisma.service';
import { EngagementService } from '../engagement/engagement.service';
import { PostsService } from '../posts/posts.service';
import { AdminService } from './admin.service';

describe('AdminService.blockUser', () => {
  it('admin o`zini bloklay olmaydi → 400, DB ga tegmaydi', async () => {
    const update = jest.fn();
    const prisma = { user: { update } } as unknown as PrismaService;
    const service = new AdminService(
      prisma,
      {} as PostsService,
      {} as EngagementService,
    );

    await expect(service.blockUser('admin1', 'admin1')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    expect(update).not.toHaveBeenCalled();
  });
});
