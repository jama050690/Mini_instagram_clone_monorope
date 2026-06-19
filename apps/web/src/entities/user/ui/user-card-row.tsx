import { Link } from 'react-router-dom';
import type { UserCard } from '../model/types';
import { UserAvatar } from './user-avatar';

/** Qidiruv/ro'yxatlarda bitta foydalanuvchi qatori — profilga link. */
export function UserCardRow({ user }: { user: UserCard }) {
  return (
    <Link
      to={`/u/${user.username}`}
      className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
    >
      <UserAvatar user={user} className="size-11" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{user.username}</p>
        <p className="truncate text-sm text-muted-foreground">{user.fullName}</p>
      </div>
    </Link>
  );
}
