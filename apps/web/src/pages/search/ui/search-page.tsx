import { Search } from 'lucide-react';
import { useState } from 'react';
import { UserList, useSearchUsers } from '@/features/profile';
import { useDebounce } from '@/shared/lib/use-debounce';
import { Input } from '@/shared/ui';

export function SearchPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q.trim(), 350);
  const query = useSearchUsers(debouncedQ);

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Foydalanuvchilarni qidirish..."
          className="pl-9"
          autoFocus
        />
      </div>

      {debouncedQ.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Username yoki ism bo`yicha qidiring.
        </p>
      ) : (
        <UserList
          items={items}
          isLoading={query.isLoading}
          hasNextPage={!!query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
          onLoadMore={() => void query.fetchNextPage()}
          emptyText="Hech narsa topilmadi"
        />
      )}
    </div>
  );
}
