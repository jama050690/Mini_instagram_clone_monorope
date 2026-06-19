import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserCard } from '@/entities/user';
import { UserAvatar } from '@/entities/user';
import { Button } from '@/shared/ui';
import {
  useAcceptRequest,
  useFollowRequests,
  useRejectRequest,
} from '../api/use-follow';

function RequestRow({ user }: { user: UserCard }) {
  const accept = useAcceptRequest();
  const reject = useRejectRequest();
  const busy = accept.isPending || reject.isPending;

  return (
    <div className="flex items-center gap-3 py-2">
      <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar user={user} className="size-10" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {user.username}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {user.fullName}
          </span>
        </span>
      </Link>
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={accept.isPending}
          disabled={busy}
          onClick={() => accept.mutate(user.id)}
        >
          Tasdiqlash
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => reject.mutate(user.id)}
        >
          Rad etish
        </Button>
      </div>
    </div>
  );
}

/** Kelgan follow so'rovlari ro'yxati + tasdiqlash/rad etish. */
export function FollowRequests() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useFollowRequests();

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Yangi so`rov yo`q.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {items.map((u) => (
        <RequestRow key={u.id} user={u} />
      ))}
      {hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            loading={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            Ko`proq yuklash
          </Button>
        </div>
      ) : null}
    </div>
  );
}
