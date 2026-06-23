import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '@/entities/post';
import { cn } from '@/shared/lib/cn';
import { useToggleLike } from '../api/use-engagement';

export function LikeBar({ post }: { post: Post }) {
  const toggle = useToggleLike();

  return (
    <div className="px-4 pb-4 pt-1">
      <div className="mb-2 flex items-center">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={post.likedByMe ? 'Like olib tashlash' : 'Like bosish'}
            disabled={toggle.isPending}
            onClick={() => toggle.mutate(post)}
            className="group transition-transform active:scale-90 disabled:opacity-50"
          >
            <Heart
              className={cn(
                'size-6 transition-colors',
                post.likedByMe
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-700 group-hover:text-red-400',
              )}
            />
          </button>
          <Link to={`/p/${post.id}`} className="group">
            <MessageCircle className="size-6 text-gray-700 transition-colors group-hover:text-violet-500" />
          </Link>
          <button type="button" className="group">
            <Send className="size-6 text-gray-700 transition-colors group-hover:text-blue-500" />
          </button>
        </div>
        <div className="ml-auto">
          <Bookmark className="size-6 text-gray-700 transition-colors hover:text-yellow-500" />
        </div>
      </div>

      {post.likeCount > 0 && (
        <p className="text-sm font-semibold text-gray-900">
          {post.likeCount.toLocaleString()} ta like
        </p>
      )}

      {post.commentCount > 0 && (
        <Link to={`/p/${post.id}`} className="mt-0.5 block text-sm text-gray-400 hover:text-gray-600">
          Hamma {post.commentCount} ta izohni ko`rish
        </Link>
      )}
    </div>
  );
}
