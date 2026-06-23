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

function notificationText(n: NotificationItem): string {
  switch (n.type) {
    case 'NEW_FOLLOWER': return 'sizga obuna bo\'ldi';
    case 'FOLLOW_REQUEST': return 'obuna so\'rov yubordi';
    case 'FOLLOW_ACCEPTED': return 'obuna so\'rovingizni qabul qildi';
    case 'POST_LIKED': return 'postingizni yoqtirdi';
    case 'POST_COMMENTED': return 'postingizga izoh qoldirdi';
    case 'POST_CREATED': return 'yangi post qo\'ydi';
    default: return '';
  }
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 ${!item.isRead ? 'bg-blue-50/40' : ''}`}>
      <Link to={`/u/${item.actor.username}`} className="shrink-0">
        <UserAvatar user={item.actor} className="size-11" />
      </Link>

      <div className="flex-1 text-sm leading-snug">
        <Link to={`/u/${item.actor.username}`} className="font-semibold text-neutral-900 hover:underline">
          {item.actor.username}
        </Link>{' '}
        <span className="text-neutral-800">{notificationText(item)}</span>
        {' '}
        <span className="text-neutral-400 text-xs">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </span>
        {item.postId && (
          <Link to={`/p/${item.postId}`} className="ml-1 text-xs text-blue-500 hover:underline">
            ko'rish
          </Link>
        )}
      </div>

      {!item.isRead && (
        <span className="size-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { data, isLoading } = useNotificationsList();
  const markRead = useMarkAllRead();

  useEffect(() => {
    if (data?.items.some((n) => !n.isRead)) markRead.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-base font-semibold text-neutral-900">Bildirishnomalar</h1>

      {isLoading ? (
        <p className="text-sm text-neutral-400">Yuklanmoqda...</p>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center gap-4 py-20 text-neutral-400">
          <Bell className="size-12 stroke-1" />
          <p className="text-sm">Hali bildirishnomalar yo`q</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {data.items.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
