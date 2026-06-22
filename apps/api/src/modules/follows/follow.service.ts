import { HttpStatus, Injectable } from '@nestjs/common';
import { FollowStatus, User } from '@prisma/client';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { buildPage, normalizeLimit, Page } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { toUserCard, UserCard } from '../users/user-card.serializer';
import { VisibilityService } from '../visibility/visibility.service';
import { FollowState } from './follow.serializer';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Follow: public → darhol ACCEPTED, private → PENDING (so'rov). Yozuv mavjud
   * bo'lsa idempotent (joriy holatni qaytaradi). Self-follow → 400.
   */
  async follow(follower: User, username: string): Promise<FollowState> {
    const target = await this.resolveTarget(username, follower);
    if (target.id === follower.id) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.SELF_FOLLOW,
        'O`zingizga obuna bo`la olmaysiz',
      );
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: target.id,
        },
      },
    });
    if (existing) {
      return { relationship: this.toRelationship(existing.status) };
    }

    const status = target.isPrivate
      ? FollowStatus.PENDING
      : FollowStatus.ACCEPTED;
    await this.prisma.follow.create({
      data: { followerId: follower.id, followingId: target.id, status },
    });
    await this.notifications.create({
      type: status === FollowStatus.ACCEPTED ? 'NEW_FOLLOWER' : 'FOLLOW_REQUEST',
      recipientId: target.id,
      actorId: follower.id,
    });
    return { relationship: this.toRelationship(status) };
  }

  /** Unfollow / pending so'rovni bekor qilish — bir xil amal (idempotent). */
  async unfollow(follower: User, username: string): Promise<FollowState> {
    const target = await this.resolveTarget(username, follower);
    await this.prisma.follow.deleteMany({
      where: { followerId: follower.id, followingId: target.id },
    });
    return { relationship: 'none' };
  }

  /** Menga kelgan PENDING so'rovlar — so'rovchi user'lar (cursor pagination). */
  async listRequests(
    user: User,
    cursor?: string,
    limit?: number,
  ): Promise<Page<UserCard>> {
    const take = normalizeLimit(limit);
    const rows = await this.prisma.follow.findMany({
      where: { followingId: user.id, status: FollowStatus.PENDING },
      include: { follower: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const page = buildPage(rows, take, (f) => f.id);
    return {
      items: page.items.map((f) => toUserCard(f.follower)),
      nextCursor: page.nextCursor,
    };
  }

  /** So'rovni tasdiqlash (PENDING→ACCEPTED) — faqat target egasi. */
  async acceptRequest(user: User, requesterId: string): Promise<void> {
    const result = await this.prisma.follow.updateMany({
      where: {
        followerId: requesterId,
        followingId: user.id,
        status: FollowStatus.PENDING,
      },
      data: { status: FollowStatus.ACCEPTED },
    });
    if (result.count === 0) {
      throw AppException.notFound('So`rov topilmadi');
    }
    await this.notifications.create({
      type: 'FOLLOW_ACCEPTED',
      recipientId: requesterId,
      actorId: user.id,
    });
  }

  /** So'rovni rad etish (PENDING yozuv o'chiriladi) — faqat target egasi. */
  async rejectRequest(user: User, requesterId: string): Promise<void> {
    const result = await this.prisma.follow.deleteMany({
      where: {
        followerId: requesterId,
        followingId: user.id,
        status: FollowStatus.PENDING,
      },
    });
    if (result.count === 0) {
      throw AppException.notFound('So`rov topilmadi');
    }
  }

  private toRelationship(status: FollowStatus): FollowState['relationship'] {
    return status === FollowStatus.ACCEPTED ? 'following' : 'requested';
  }

  /** username→user; yo'q/bloklangan/admin (egasidan boshqaga) → 404. */
  private resolveTarget(username: string, viewer: User): Promise<User> {
    return this.visibility.resolveVisibleUser(username, viewer);
  }
}
