import { Loader2 } from 'lucide-react';
import { useFeed, FeedList } from '@/features/feed';
import { SuggestedUsers } from '@/features/follow';

export function HomePage() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useFeed();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  const isFallback = data?.pages[0]?.isFallback ?? false;

  return (
    <div className="flex gap-8">
      {/* Feed */}
      <div className="min-w-0 flex-1">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/80 py-20 text-center shadow backdrop-blur-sm">
            <span className="text-6xl">📷</span>
            <p className="text-lg font-semibold text-gray-800">Postlar hali yo`q</p>
            <p className="text-sm text-gray-500">
              Kimgadir obuna bo`ling va yangi postlarni ko`ring
            </p>
          </div>
        ) : (
          <>
            {isFallback && (
              <p className="mb-4 text-center text-sm text-gray-400">
                Tavsiya etilgan postlar
              </p>
            )}
            <FeedList
              posts={posts}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => void fetchNextPage()}
            />
          </>
        )}
      </div>

      {/* Suggested sidebar — desktop only */}
      <div className="hidden w-72 shrink-0 xl:block">
        <SuggestedUsers />
      </div>
    </div>
  );
}
