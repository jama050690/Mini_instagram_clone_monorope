import { Injectable } from '@nestjs/common';
import { FollowStatus, Prisma, Role, User } from '@prisma/client';
import { buildPage, normalizeLimit, Page } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { PostView, postIncludeFor, toPostView } from '../posts/post.serializer';

/** Feed sahifasi — bo'sh bo'lsa fallback (public postlar) bilan. */
export interface FeedPage extends Page<PostView> {
  isFallback: boolean;
}

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Xronologik lenta (SRS 4.7): viewer ACCEPTED follow qilganlar + o'zining
   * postlari, eng yangidan. Hech narsa yo'q bo'lsa → so'nggi public postlar
   * (`isFallback: true`).
   */
  async getFeed(
    viewer: User,
    cursor?: string,
    limit?: number,
  ): Promise<FeedPage> {
    const take = normalizeLimit(limit);

    const accepted = await this.prisma.follow.findMany({
      where: { followerId: viewer.id, status: FollowStatus.ACCEPTED },
      select: { followingId: true },
    });
    const authorIds = [viewer.id, ...accepted.map((f) => f.followingId)];

    const primaryWhere: Prisma.PostWhereInput = {
      authorId: { in: authorIds },
      deletedAt: null,
      author: { isBlocked: false },
    };
    const hasPrimary = await this.prisma.post.findFirst({
      where: primaryWhere,
      select: { id: true },
    });

    const fallbackWhere: Prisma.PostWhereInput = {
      deletedAt: null,
      author: { isPrivate: false, isBlocked: false, role: { not: Role.ADMIN } },
    };

    const rows = await this.prisma.post.findMany({
      where: hasPrimary ? primaryWhere : fallbackWhere,
      include: postIncludeFor(viewer.id),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const page = buildPage(rows, take, (row) => row.id);
    return {
      items: page.items.map(toPostView),
      nextCursor: page.nextCursor,
      isFallback: !hasPrimary,
    };
  }
}
