import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { useSuggested } from '../api/use-follow';
import { FollowButton } from './follow-button';

export function SuggestedUsers() {
  const { data, isLoading } = useSuggested();

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-5 animate-spin text-violet-400" />
      </div>
    );
  }

  const users = data ?? [];
  if (users.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white/80 p-4 shadow backdrop-blur-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-500">Tavsiya etilganlar</h2>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar user={user} className="size-9" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">{user.username}</span>
                <span className="block truncate text-xs text-gray-500">{user.fullName}</span>
              </span>
            </Link>
            <FollowButton username={user.username} relationship="none" />
          </div>
        ))}
      </div>
    </section>
  );
}
