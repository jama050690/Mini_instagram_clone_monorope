import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { buildPage, normalizeLimit, Page } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { EngagementService } from '../engagement/engagement.service';
import { PostView, postIncludeFor, toPostView } from '../posts/post.serializer';
import { PostsService } from '../posts/posts.service';
import {
  AdminStats,
  AdminUserDetail,
  AdminUserView,
  toAdminUserView,
} from './admin.serializer';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService,
    private readonly engagement: EngagementService,
  ) {}

  /** Dashboard statistikasi (SRS 4.8). */
  async stats(): Promise<AdminStats> {
    const since = new Date(Date.now() - WEEK_MS);
    const [
      totalUsers,
      blockedUsers,
      totalPosts,
      totalComments,
      newUsers7d,
      newPosts7d,
      privateUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isBlocked: true } }),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.post.count({
        where: { deletedAt: null, createdAt: { gte: since } },
      }),
      this.prisma.user.count({ where: { isPrivate: true } }),
    ]);

    return {
      totalUsers,
      blockedUsers,
      totalPosts,
      totalComments,
      newUsers7d,
      newPosts7d,
      privateUsers,
      publicUsers: totalUsers - privateUsers,
    };
  }

  /** Foydalanuvchilar ro'yxati (qidiruv, bloklanganlar ham). Cursor = id desc. */
  async listUsers(
    search?: string,
    cursor?: string,
    limit?: number,
  ): Promise<Page<AdminUserView>> {
    const take = normalizeLimit(limit);
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const rows = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const page = buildPage(rows, take, (u) => u.id);
    return {
      items: page.items.map(toAdminUserView),
      nextCursor: page.nextCursor,
    };
  }

  /** Bitta user (counts bilan). */
  async getUser(id: string): Promise<AdminUserDetail> {
    const user = await this.getUserOrThrow(id);
    const [posts, followers, following] = await Promise.all([
      this.prisma.post.count({ where: { authorId: id, deletedAt: null } }),
      this.prisma.follow.count({
        where: { followingId: id, status: 'ACCEPTED' },
      }),
      this.prisma.follow.count({
        where: { followerId: id, status: 'ACCEPTED' },
      }),
    ]);
    return {
      ...toAdminUserView(user),
      counts: { posts, followers, following },
    };
  }

  /** Bloklash — admin o'zini bloklay olmaydi. */
  async blockUser(adminId: string, id: string): Promise<AdminUserView> {
    if (id === adminId) {
      throw AppException.badRequest('O`zingizni bloklay olmaysiz');
    }
    await this.getUserOrThrow(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    });
    return toAdminUserView(user);
  }

  /** Blokdan chiqarish. */
  async unblockUser(id: string): Promise<AdminUserView> {
    await this.getUserOrThrow(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isBlocked: false },
    });
    return toAdminUserView(user);
  }

  /** Postlar ro'yxati (moderatsiya) — faol postlar, yangi → eski. */
  async listPosts(cursor?: string, limit?: number): Promise<Page<PostView>> {
    const take = normalizeLimit(limit);
    const rows = await this.prisma.post.findMany({
      where: { deletedAt: null },
      include: postIncludeFor(''),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const page = buildPage(rows, take, (p) => p.id);
    return { items: page.items.map(toPostView), nextCursor: page.nextCursor };
  }

  /** Postni o'chirish (soft + fayllar) — PostsService.remove reuse (admin). */
  async deletePost(admin: User, postId: string): Promise<void> {
    await this.posts.remove(postId, admin);
  }

  /** Izohni o'chirish — EngagementService.deleteComment reuse (admin). */
  async deleteComment(admin: User, commentId: string): Promise<void> {
    await this.engagement.deleteComment(commentId, admin);
  }

  private async getUserOrThrow(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw AppException.notFound('Foydalanuvchi topilmadi');
    }
    return user;
  }
}
