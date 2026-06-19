import { Loader2, Trash2 } from 'lucide-react';
import { PostThumb, type Post } from '@/entities/post';
import { Button } from '@/shared/ui';
import { useAdminDeletePost, useAdminPosts } from '../api/use-admin';

function PostCell({ post }: { post: Post }) {
  const del = useAdminDeletePost();

  function handleDelete() {
    if (!window.confirm('Bu postni o`chirishni tasdiqlaysizmi?')) return;
    del.mutate(post.id);
  }

  return (
    <div className="relative">
      <PostThumb post={post} />
      <Button
        size="icon"
        variant="destructive"
        className="absolute right-1 top-1 size-7"
        title="O`chirish"
        loading={del.isPending}
        onClick={handleDelete}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

export function AdminPosts() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useAdminPosts();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Post yo`q.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map((post) => (
          <PostCell key={post.id} post={post} />
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
