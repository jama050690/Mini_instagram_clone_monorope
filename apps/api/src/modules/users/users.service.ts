import { Injectable } from '@nestjs/common';
import { FollowStatus, Role, User } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { buildPage, normalizeLimit, Page } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { VisibilityService } from '../visibility/visibility.service';
import {
  ProfileCounts,
  ProfileView,
  Relationship,
  toProfileView,
} from './profile-view.serializer';
import { toUserCard, UserCard } from './user-card.serializer';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  /**
   * username/fullName bo'yicha qidiruv (case-insensitive). Bloklangan va admin
   * user'lar chiqmaydi (admin user-facing qismda yashirin). Cursor = `username`
   * (asc tartib), barqaror sahifalash uchun.
   */
  async search(
    q: string,
    cursor: string | undefined,
    limit?: number,
  ): Promise<Page<UserCard>> {
    const take = normalizeLimit(limit);
    const rows = await this.prisma.user.findMany({
      where: {
        isBlocked: false,
        role: { not: Role.ADMIN },
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { fullName: { contains: q, mode: 'insensitive' } },
        ],
        ...(cursor ? { username: { gt: cursor } } : {}),
      },
      orderBy: { username: 'asc' },
      take: take + 1,
    });

    const page = buildPage(rows, take, (u) => u.username);
    return { items: page.items.map(toUserCard), nextCursor: page.nextCursor };
  }

  /**
   * Tavsiya etilgan profillar (bo'sh feed UI uchun, SRS 6.2): viewer hali follow
   * qilmagan public userlar — bloklangan/admin/o'zi chiqmaydi. Eng yangidan.
   */
  async suggested(viewer: User, limit?: number): Promise<UserCard[]> {
    const take = normalizeLimit(limit);
    const followed = await this.prisma.follow.findMany({
      where: { followerId: viewer.id },
      select: { followingId: true },
    });
    const excludeIds = [viewer.id, ...followed.map((f) => f.followingId)];

    const rows = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        isPrivate: false,
        isBlocked: false,
        role: { not: Role.ADMIN },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows.map(toUserCard);
  }

  /**
   * Profil ko'rish (maxfiylikka bo'ysunadi). Bloklangan user boshqalarga
   * mavjud emasdek (404). Private + non-follower → profil qobig'i
   * (`canViewPosts=false`).
   */
  async getProfile(username: string, viewer: User): Promise<ProfileView> {
    const user = await this.findVisibleUser(username, viewer);

    const counts = await this.countsFor(user.id);
    const relationship = await this.relationshipBetween(viewer, user);
    const canViewPosts =
      relationship === 'self' ||
      !user.isPrivate ||
      relationship === 'following';

    return toProfileView(user, counts, relationship, canViewPosts);
  }

  /** `:username`ning obunachilari (uni kuzatuvchilar). Maxfiylikka bo'ysunadi. */
  async listFollowers(
    username: string,
    viewer: User,
    cursor: string | undefined,
    limit?: number,
  ): Promise<Page<UserCard>> {
    const target = await this.findVisibleUser(username, viewer);
    await this.assertCanViewList(viewer, target);
    return this.followPage(
      { followingId: target.id },
      (f) => f.follower,
      cursor,
      limit,
    );
  }

  /** `:username` kuzatayotganlar (obunalari). Maxfiylikka bo'ysunadi. */
  async listFollowing(
    username: string,
    viewer: User,
    cursor: string | undefined,
    limit?: number,
  ): Promise<Page<UserCard>> {
    const target = await this.findVisibleUser(username, viewer);
    await this.assertCanViewList(viewer, target);
    return this.followPage(
      { followerId: target.id },
      (f) => f.following,
      cursor,
      limit,
    );
  }

  /**
   * Follow yozuvlarini ACCEPTED holatda, createdAt desc tartibda sahifalaydi.
   * `pick` har Follow'dan ko'rsatiladigan User'ni tanlaydi (follower yoki
   * following). Cursor = Follow.id (Prisma cursor pagination).
   */
  private async followPage(
    where: { followerId: string } | { followingId: string },
    pick: (f: { follower: User; following: User }) => User,
    cursor: string | undefined,
    limit?: number,
  ): Promise<Page<UserCard>> {
    const take = normalizeLimit(limit);
    const rows = await this.prisma.follow.findMany({
      where: { ...where, status: FollowStatus.ACCEPTED },
      include: { follower: true, following: true },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const page = buildPage(rows, take, (f) => f.id);
    return {
      items: page.items.map((f) => toUserCard(pick(f))),
      nextCursor: page.nextCursor,
    };
  }

  /** username→user; yo'q/bloklangan/admin (egasidan boshqaga) → 404. */
  private findVisibleUser(username: string, viewer: User): Promise<User> {
    return this.visibility.resolveVisibleUser(username, viewer);
  }

  /**
   * Private account'ning follower/following ro'yxati faqat egasiga va
   * tasdiqlangan obunachilarga ko'rinadi; aks holda 403.
   */
  private async assertCanViewList(viewer: User, target: User): Promise<void> {
    if (!target.isPrivate || viewer.id === target.id) return;
    const relationship = await this.relationshipBetween(viewer, target);
    if (relationship !== 'following') {
      throw AppException.forbidden('Bu ro`yxat faqat obunachilarga ko`rinadi');
    }
  }

  private async countsFor(userId: string): Promise<ProfileCounts> {
    const [posts, followers, following] = await Promise.all([
      this.prisma.post.count({ where: { authorId: userId, deletedAt: null } }),
      this.prisma.follow.count({
        where: { followingId: userId, status: FollowStatus.ACCEPTED },
      }),
      this.prisma.follow.count({
        where: { followerId: userId, status: FollowStatus.ACCEPTED },
      }),
    ]);
    return { posts, followers, following };
  }

  /** Viewer → target munosabati. */
  private relationshipBetween(
    viewer: User,
    target: User,
  ): Promise<Relationship> {
    return this.visibility.relationship(viewer.id, target.id);
  }
}
