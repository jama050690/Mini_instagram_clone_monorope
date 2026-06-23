import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { useAuthStore } from '@/features/auth';
import { useSuggested } from '../api/use-follow';
import { FollowButton } from './follow-button';

export function SuggestedUsers() {
  const { data, isLoading } = useSuggested();
  const me = useAuthStore((s) => s.user);

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-neutral-400" /></div>;

  const users = data ?? [];

  return (
    <div className="sticky top-6 w-[320px] shrink-0">
      {/* Me */}
      {me && (
        <div className="mb-6 flex items-center justify-between">
          <Link to={`/u/${me.username}`} className="flex items-center gap-3">
            <UserAvatar user={me} className="size-11" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">{me.username}</p>
              <p className="text-sm text-neutral-500">{me.fullName}</p>
            </div>
          </Link>
        </div>
      )}

      {users.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-neutral-500">Tavsiya etilganlar</span>
            <button type="button" className="text-xs font-semibold text-neutral-900 hover:text-neutral-600">
              Barchasini ko`rish
            </button>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2">
                <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <UserAvatar user={user} className="size-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{user.username}</p>
                    <p className="truncate text-xs text-neutral-500">{user.fullName}</p>
                  </div>
                </Link>
                <FollowButton username={user.username} relationship="none" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
