import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ACTOR_SELECT = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
};

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    type: NotificationType;
    recipientId: string;
    actorId: string;
    postId?: string;
  }): Promise<void> {
    if (data.recipientId === data.actorId) return;
    await this.prisma.notification.create({ data });
  }

  async list(userId: string, cursor?: string, limit = 20) {
    const take = Math.min(limit, 50);
    const items = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        isRead: true,
        postId: true,
        createdAt: true,
        actor: { select: ACTOR_SELECT },
      },
    });

    const hasMore = items.length > take;
    if (hasMore) items.pop();
    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  }
}
