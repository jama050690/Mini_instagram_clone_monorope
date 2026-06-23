import { Hash, Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { PostThumb } from '@/entities/post';
import { useHashtagPosts } from '@/features/hashtags';
import { UserList, useSearchUsers } from '@/features/profile';
import { useDebounce } from '@/shared/lib/use-debounce';
import { Button, Input } from '@/shared/ui';

export function SearchPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q.trim(), 350);

  const isHashtag = debouncedQ.startsWith('#');
  const hashtagName = isHashtag ? debouncedQ.slice(1) : '';

  const userQuery = useSearchUsers(isHashtag ? '' : debouncedQ);
  const hashtagQuery = useHashtagPosts(hashtagName);

  const userItems = userQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const hashPosts = hashtagQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const hashMeta = hashtagQuery.data?.pages[0];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Qidirish... (#hashtag yoki @username)"
          className="rounded-full bg-white/80 pl-9 shadow-sm backdrop-blur-sm"
          autoFocus
        />
      </div>

      {/* Tip */}
      {debouncedQ.length === 0 && (
        <div className="space-y-3 pt-4 text-center text-sm text-gray-400">
          <p>Foydalanuvchilarni topish uchun username yoki ism kiriting</p>
          <p>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-violet-600">
              <Hash className="size-3.5" /> hashtag
            </span>{' '}
            yozib hashtag bo`yicha postlarni qidiring
          </p>
        </div>
      )}

      {/* Hashtag results */}
      {isHashtag && hashtagName.length > 0 && (
        <div className="space-y-3">
          {/* Hashtag chip header */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-5 py-4 shadow backdrop-blur-sm">
            <div
              className="flex size-10 items-center justify-center rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              <Hash className="size-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">#{hashtagName}</p>
              {hashMeta && (
                <p className="text-xs text-gray-500">
                  {hashMeta.postCount.toLocaleString()} ta post
                </p>
              )}
            </div>
          </div>

          {/* Grid */}
          {hashtagQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-violet-400" />
            </div>
          ) : hashPosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              #{hashtagName} bo`yicha post topilmadi
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                {hashPosts.map((post) => (
                  <PostThumb key={post.id} post={post} />
                ))}
              </div>
              {hashtagQuery.hasNextPage && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => void hashtagQuery.fetchNextPage()}
                    disabled={hashtagQuery.isFetchingNextPage}
                  >
                    {hashtagQuery.isFetchingNextPage
                      ? <Loader2 className="size-4 animate-spin" />
                      : 'Ko`proq yuklash'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* User results */}
      {!isHashtag && debouncedQ.length > 0 && (
        <UserList
          items={userItems}
          isLoading={userQuery.isLoading}
          hasNextPage={!!userQuery.hasNextPage}
          isFetchingNextPage={userQuery.isFetchingNextPage}
          onLoadMore={() => void userQuery.fetchNextPage()}
          emptyText="Hech narsa topilmadi"
        />
      )}
    </div>
  );
}
