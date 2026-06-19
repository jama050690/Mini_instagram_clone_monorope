import { Loader2 } from 'lucide-react';
import type { UserCard } from '@/entities/user';
import { UserCardRow } from '@/entities/user';
import { Button } from '@/shared/ui';

interface UserListProps {
  items: UserCard[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  emptyText: string;
}

/** Qidiruv/followers/following uchun umumiy ro'yxat + "ko'proq yuklash". */
export function UserList({
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyText,
}: UserListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((u) => (
        <UserCardRow key={u.id} user={u} />
      ))}
      {hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" loading={isFetchingNextPage} onClick={onLoadMore}>
            Ko`proq yuklash
          </Button>
        </div>
      ) : null}
    </div>
  );
}
