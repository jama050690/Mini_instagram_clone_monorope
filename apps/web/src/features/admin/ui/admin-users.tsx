import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { useDebounce } from '@/shared/lib/use-debounce';
import { Button, Input } from '@/shared/ui';
import {
  useAdminUsers,
  useBlockUser,
  useUnblockUser,
} from '../api/use-admin';
import type { AdminUser } from '../model/types';

function UserRow({ user }: { user: AdminUser }) {
  const block = useBlockUser();
  const unblock = useUnblockUser();
  const busy = block.isPending || unblock.isPending;
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="flex items-center gap-3 py-2">
      <Link
        to={`/u/${user.username}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <UserAvatar user={user} className="size-9" />
        <span className="min-w-0">
          <span className="flex items-center gap-2 truncate text-sm font-semibold">
            {user.username}
            {isAdmin ? (
              <span className="rounded bg-primary/10 px-1 text-xs text-primary">
                admin
              </span>
            ) : null}
            {user.isBlocked ? (
              <span className="rounded bg-destructive/10 px-1 text-xs text-destructive">
                bloklangan
              </span>
            ) : null}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </span>
      </Link>
      {isAdmin ? null : user.isBlocked ? (
        <Button
          size="sm"
          variant="outline"
          loading={unblock.isPending}
          disabled={busy}
          onClick={() => unblock.mutate(user.id)}
        >
          Blokdan chiqarish
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          loading={block.isPending}
          disabled={busy}
          onClick={() => block.mutate(user.id)}
        >
          Bloklash
        </Button>
      )}
    </div>
  );
}

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAdminUsers(debounced);

  const users = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-3">
      <Input
        placeholder="username / ism / email bo`yicha qidiruv"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Foydalanuvchi topilmadi.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {users.map((u) => (
            <UserRow key={u.id} user={u} />
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
      )}
    </div>
  );
}
