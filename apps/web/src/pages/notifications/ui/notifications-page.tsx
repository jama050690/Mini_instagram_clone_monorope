import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import {
  useMarkAllRead,
  useNotificationsList,
  type NotificationItem,
} from '@/features/notifications';
import { Button } from '@/shared/ui';

function notificationText(n: NotificationItem): string {
  switch (n.type) {
    case 'NEW_FOLLOWER':
      return 'sizga obuna bo\'ldi';
    case 'FOLLOW_REQUEST':
      return 'obuna so\'rov yubordi';
    case 'FOLLOW_ACCEPTED':
      return 'obuna so\'rovingizni qabul qildi';
    case 'POST_LIKED':
      return 'postingizni yoqtirdi';
    case 'POST_COMMENTED':
      return 'postingizga izoh qoldirdi';
  }
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
        item.isRead ? '' : 'bg-accent/40'
      }`}
    >
      <Link to={`/u/${item.actor.username}`}>
        <UserAvatar user={item.actor} className="size-10 shrink-0" />
      </Link>
      <div className="flex-1 text-sm">
        <Link
          to={`/u/${item.actor.username}`}
          className="font-semibold hover:underline"
        >
          {item.actor.username}
        </Link>{' '}
        {notificationText(item)}
        {item.postId ? (
          <>
            {' '}
            <Link
              to={`/p/${item.postId}`}
              className="text-muted-foreground hover:underline"
            >
              (postni ko'rish)
            </Link>
          </>
        ) : null}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
      </span>
    </div>
  );
}

export function NotificationsPage() {
  const { data, isLoading } = useNotificationsList();
  const markRead = useMarkAllRead();

  useEffect(() => {
    if (data?.items.some((n) => !n.isRead)) {
      markRead.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Bildirishnomalar</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Bell className="size-10" />
          <p>Bildirishnomalar yo'q</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {data.items.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
