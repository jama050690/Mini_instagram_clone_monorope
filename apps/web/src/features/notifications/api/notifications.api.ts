import { apiClient } from '@/shared/api';

export type NotificationType =
  | 'NEW_FOLLOWER'
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_ACCEPTED'
  | 'POST_LIKED'
  | 'POST_COMMENTED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  isRead: boolean;
  postId: string | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface NotificationPage {
  items: NotificationItem[];
  nextCursor: string | null;
}

export const notificationsApi = {
  list: (cursor?: string): Promise<NotificationPage> =>
    apiClient
      .get('/notifications', { params: { cursor, limit: 20 } })
      .then((r) => r.data.data),

  unreadCount: (): Promise<number> =>
    apiClient
      .get('/notifications/unread-count')
      .then((r) => r.data.data.count),

  markAllRead: (): Promise<void> =>
    apiClient.patch('/notifications/read').then(() => undefined),
};
