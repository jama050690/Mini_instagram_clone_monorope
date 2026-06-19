import { Loader2 } from 'lucide-react';
import { PostThumb } from '@/entities/post';
import { Button } from '@/shared/ui';
import { useUserPosts } from '../api/use-post';

/** Profil grid'i — username postlari (3 ustun), cursor "ko'proq yuklash". */
export function PostGrid({ username }: { username: string }) {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useUserPosts(username);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Hali post yo`q.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map((post) => (
          <PostThumb key={post.id} post={post} />
        ))}
      </div>
      {hasNextPage ? (
        <div className="flex justify-center">
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
