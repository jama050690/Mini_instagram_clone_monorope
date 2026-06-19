import { Injectable } from '@nestjs/common';
import { FollowStatus, Role, User } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { Relationship } from '../users/profile-view.serializer';

/** Maxfiylik tekshiruvi uchun kerakli minimal author maydonlari. */
export interface AuthorVisibility {
  id: string;
  isPrivate: boolean;
}

/**
 * User-visibility/maxfiylik mantig'ining yagona manbasi (Users, Posts, Media,
 * Follow modullari shu yerdan foydalanadi). Avval bu mantiq har modulda
 * takrorlangan edi — konsolidatsiya qilindi.
 */
@Injectable()
export class VisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bloklangan yoki admin user (egasidan boshqaga) user-facing qismda yashirin.
   */
  hiddenFromViewer(
    user: Pick<User, 'id' | 'isBlocked' | 'role'>,
    viewerId: string,
  ): boolean {
    return user.id !== viewerId && (user.isBlocked || user.role === Role.ADMIN);
  }

  /** username→user; yo'q/bloklangan/admin (egasidan boshqaga) → 404. */
  async resolveVisibleUser(username: string, viewer: User): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || this.hiddenFromViewer(user, viewer.id)) {
      throw AppException.notFound('Foydalanuvchi topilmadi');
    }
    return user;
  }

  /** Viewer target'ning tasdiqlangan (ACCEPTED) obunachisimi? (self → true). */
  async isAcceptedFollower(
    viewerId: string,
    authorId: string,
  ): Promise<boolean> {
    if (viewerId === authorId) return true;
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: authorId },
      },
    });
    return follow?.status === FollowStatus.ACCEPTED;
  }

  /**
   * Private author kontentini (post/media/ro'yxat) ko'rish huquqi: self yoki
   * public → ruxsat; aks holda ACCEPTED follower bo'lishi shart, yo'qsa 403.
   */
  async assertCanViewContent(
    viewerId: string,
    author: AuthorVisibility,
    message = 'Bu kontent faqat obunachilarga ko`rinadi',
  ): Promise<void> {
    if (author.id === viewerId || !author.isPrivate) return;
    if (!(await this.isAcceptedFollower(viewerId, author.id))) {
      throw AppException.forbidden(message);
    }
  }

  /** Viewer → target munosabati (self/following/requested/none). */
  async relationship(
    viewerId: string,
    targetId: string,
  ): Promise<Relationship> {
    if (viewerId === targetId) return 'self';
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: targetId },
      },
    });
    if (!follow) return 'none';
    return follow.status === FollowStatus.ACCEPTED ? 'following' : 'requested';
  }
}
