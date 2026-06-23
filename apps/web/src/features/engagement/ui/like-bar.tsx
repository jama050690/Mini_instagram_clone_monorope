import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '@/entities/post';
import { cn } from '@/shared/lib/cn';
import { useToggleLike } from '../api/use-engagement';

export function LikeBar({ post }: { post: Post }) {
  const toggle = useToggleLike();

  return (
    <div className="px-4 pb-2 pt-1">
      {/* Action icons */}
      <div className="mb-2 flex items-center">
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
                post.likedByMe ? 'fill-red-500 text-red-500' : 'text-neutral-800',
              )}
            />
          </button>

          <Link to={`/p/${post.id}`}>
            <MessageCircle className="size-6 text-neutral-800" />
          </Link>

          <button type="button" className="transition-transform active:scale-90">
            <Send className="size-6 text-neutral-800" />
          </button>
        </div>

        <div className="ml-auto">
          <Bookmark className="size-6 text-neutral-800" />
        </div>
      </div>

      {/* Like count */}
      {post.likeCount > 0 && (
        <p className="text-sm font-semibold text-neutral-800">
          {post.likeCount.toLocaleString()} ta like
        </p>
      )}

      {/* Comment link */}
      {post.commentCount > 0 && (
        <Link
          to={`/p/${post.id}`}
          className="mt-0.5 block text-sm text-neutral-400"
        >
          Hamma {post.commentCount} ta izohni ko`rish
        </Link>
      )}
    </div>
  );
}
