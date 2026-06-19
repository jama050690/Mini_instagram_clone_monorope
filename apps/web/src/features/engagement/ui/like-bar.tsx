import { Heart, MessageCircle } from 'lucide-react';
import type { Post } from '@/entities/post';
import { cn } from '@/shared/lib/cn';
import { useToggleLike } from '../api/use-engagement';

/** Like toggle + like/izoh sonlari. */
export function LikeBar({ post }: { post: Post }) {
  const toggle = useToggleLike();

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label={post.likedByMe ? 'Like olib tashlash' : 'Like bosish'}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(post)}
        className="transition-transform active:scale-90 disabled:opacity-50"
      >
        <Heart
          className={cn(
            'size-6',
            post.likedByMe
              ? 'fill-red-500 text-red-500'
              : 'text-foreground hover:text-muted-foreground',
          )}
        />
      </button>
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <MessageCircle className="size-6 text-foreground" />
      </span>

      <div className="ml-auto flex gap-4 text-sm font-medium">
        <span>{post.likeCount} like</span>
        <span className="text-muted-foreground">{post.commentCount} izoh</span>
      </div>
    </div>
  );
}
