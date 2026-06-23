import { Loader2 } from 'lucide-react';
import type { Post } from '@/entities/post';
import { LikeBar } from '@/features/engagement';
import { PostCard } from '@/features/post';
import { Button } from '@/shared/ui';

interface FeedListProps {
  posts: Post[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function FeedList({ posts, hasNextPage, isFetchingNextPage, onLoadMore }: FeedListProps) {
  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="mb-6">
          <PostCard post={post} />
          <LikeBar post={post} />
        </div>
      ))}

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="ghost" onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? <Loader2 className="size-5 animate-spin" /> : 'Ko`proq yuklash'}
          </Button>
        </div>
      )}
    </div>
  );
}
