import { Loader2 } from 'lucide-react';
import { useFeed, FeedList } from '@/features/feed';
import { SuggestedUsers } from '@/features/follow';

/** Bosh sahifa — xronologik feed; bo'sh bo'lsa tavsiyalar + public postlar. */
export function HomePage() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useFeed();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  const isFallback = data?.pages[0]?.isFallback ?? false;

  return (
    <div className="mx-auto max-w-md space-y-6">
      {isFallback ? (
        <>
          <p className="text-sm text-muted-foreground">
            Hali hech kimga obuna bo`lmagansiz — quyida tavsiyalar va so`nggi
            postlar.
          </p>
          <SuggestedUsers />
        </>
      ) : null}

      {posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Hali post yo`q.
        </p>
      ) : (
        <FeedList
          posts={posts}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      )}
    </div>
  );
}
