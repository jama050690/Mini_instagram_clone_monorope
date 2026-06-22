import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from '../push/push.service';

const ACTOR_SELECT = {
  id: true,
  username: true,
  fullName: true,
  avatarUrl: true,
};

const PUSH_TEXT: Record<NotificationType, (actor: string) => { title: string; body: string }> = {
  NEW_FOLLOWER:    (a) => ({ title: 'Yangi obunachi', body: `${a} sizga obuna bo'ldi` }),
  FOLLOW_REQUEST:  (a) => ({ title: 'Obuna so\'rovi', body: `${a} obuna so'radi` }),
  FOLLOW_ACCEPTED: (a) => ({ title: 'So\'rov qabul qilindi', body: `${a} so'rovingizni qabul qildi` }),
  POST_LIKED:      (a) => ({ title: 'Like', body: `${a} postingizni yoqtirdi` }),
  POST_COMMENTED:  (a) => ({ title: 'Izoh', body: `${a} izoh qoldirdi` }),
  POST_CREATED:    (a) => ({ title: 'Yangi post', body: `${a} yangi post qo'ydi` }),
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  async create(data: {
    type: NotificationType;
    recipientId: string;
    actorId: string;
    postId?: string;
  }): Promise<void> {
    if (data.recipientId === data.actorId) return;
    await this.prisma.notification.create({ data });

    const actor = await this.prisma.user.findUnique({
      where: { id: data.actorId },
      select: { username: true },
    });
    if (actor) {
      const payload = PUSH_TEXT[data.type](actor.username);
      await this.push.sendToUser(data.recipientId, {
        ...payload,
        url: data.postId ? `/p/${data.postId}` : `/u/${actor.username}`,
      });
    }
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
