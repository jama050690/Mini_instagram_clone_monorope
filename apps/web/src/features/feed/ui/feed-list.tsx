import { Link } from 'react-router-dom';
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

/** Feed postlari ro'yxati — har post karta + like bar + izohlar havolasi. */
export function FeedList({
  posts,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: FeedListProps) {
  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <div key={post.id} className="space-y-3">
          <PostCard post={post} />
          <LikeBar post={post} />
          <Link
            to={`/p/${post.id}`}
            className="block text-sm text-muted-foreground hover:underline"
          >
            {post.commentCount > 0
              ? `Hamma ${post.commentCount} izohni ko\`rish`
              : 'Izoh qoldirish'}
          </Link>
        </div>
      ))}
      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            loading={isFetchingNextPage}
            onClick={onLoadMore}
          >
            Ko`proq yuklash
          </Button>
        </div>
      ) : null}
    </div>
  );
}
