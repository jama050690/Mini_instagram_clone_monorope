import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { buildPage, normalizeLimit, Page } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { PostView } from '../posts/post.serializer';
import { PostsService } from '../posts/posts.service';
import {
  CommentView,
  commentInclude,
  toCommentView,
} from './comment.serializer';

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posts: PostsService,
  ) {}

  /** Like bosish — idempotent (takror → xato emas). Yangilangan postni qaytaradi. */
  async like(postId: string, user: User): Promise<PostView> {
    await this.posts.assertViewablePost(postId, user);
    await this.prisma.like.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      create: { userId: user.id, postId },
      update: {},
    });
    return this.posts.getById(postId, user);
  }

  /** Like olib tashlash — idempotent. Yangilangan postni qaytaradi. */
  async unlike(postId: string, user: User): Promise<PostView> {
    await this.posts.assertViewablePost(postId, user);
    await this.prisma.like.deleteMany({ where: { userId: user.id, postId } });
    return this.posts.getById(postId, user);
  }

  /** Izoh qo'shish — faqat ko'rinadigan postga. */
  async addComment(
    postId: string,
    user: User,
    text: string,
  ): Promise<CommentView> {
    await this.posts.assertViewablePost(postId, user);
    const comment = await this.prisma.comment.create({
      data: { postId, authorId: user.id, text },
      include: commentInclude,
    });
    return toCommentView(comment);
  }

  /** Izohlar ro'yxati (yangi → eski, cursor pagination). */
  async listComments(
    postId: string,
    viewer: User,
    cursor?: string,
    limit?: number,
  ): Promise<Page<CommentView>> {
    await this.posts.assertViewablePost(postId, viewer);

    const take = normalizeLimit(limit);
    const rows = await this.prisma.comment.findMany({
      where: { postId, deletedAt: null },
      include: commentInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const page = buildPage(rows, take, (row) => row.id);
    return {
      items: page.items.map(toCommentView),
      nextCursor: page.nextCursor,
    };
  }

  /**
   * Izohni o'chirish (soft) — izoh egasi, post egasi yoki admin.
   * Post o'chirilgan/izoh yo'q → 404.
   */
  async deleteComment(commentId: string, user: User): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { authorId: true, deletedAt: true } } },
    });
    if (!comment || comment.deletedAt || comment.post.deletedAt) {
      throw AppException.notFound('Izoh topilmadi');
    }

    const canDelete =
      comment.authorId === user.id ||
      comment.post.authorId === user.id ||
      user.role === Role.ADMIN;
    if (!canDelete) {
      throw AppException.forbidden('Bu izohni o`chirishga ruxsat yo`q');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }
}
