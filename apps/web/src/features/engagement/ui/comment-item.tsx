import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/ui';
import { useDeleteComment } from '../api/use-engagement';
import type { Comment } from '../model/types';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  postAuthorId: string;
}

export function CommentItem({ comment, postId, postAuthorId }: CommentItemProps) {
  const user = useAuthStore((s) => s.user);
  const del = useDeleteComment(postId);

  // O'chirish: izoh egasi, post egasi yoki admin.
  const canDelete =
    !!user &&
    (user.id === comment.author.id ||
      user.id === postAuthorId ||
      user.role === 'ADMIN');

  return (
    <div className="group flex items-start gap-2">
      <Link to={`/u/${comment.author.username}`} className="shrink-0">
        <UserAvatar
          user={{ ...comment.author, fullName: comment.author.username }}
          className="size-7"
        />
      </Link>
      <p className="flex-1 text-sm">
        <Link
          to={`/u/${comment.author.username}`}
          className="font-semibold hover:underline"
        >
          {comment.author.username}
        </Link>{' '}
        <span className="whitespace-pre-line">{comment.text}</span>
      </p>
      {canDelete ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
          title="O`chirish"
          loading={del.isPending}
          onClick={() => del.mutate(comment.id)}
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      ) : null}
    </div>
  );
}
