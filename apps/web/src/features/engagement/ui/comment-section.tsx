import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import type { Post } from '@/entities/post';
import { getApiErrorMessage } from '@/shared/api';
import { Button, Input } from '@/shared/ui';
import { useAddComment, useComments } from '../api/use-engagement';
import { CommentItem } from './comment-item';

const COMMENT_MAX_LENGTH = 1000;

/** Izoh yozish formasi + ro'yxat (infinite). */
export function CommentSection({ post }: { post: Post }) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useComments(post.id);
  const add = useAddComment(post.id);
  const [text, setText] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    add.mutate(trimmed, { onSuccess: () => setText('') });
  }

  const comments = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Izoh yozing..."
          value={text}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim()}
          loading={add.isPending}
        >
          <Send className="size-4" />
        </Button>
      </form>

      {add.error ? (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(add.error)}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Hali izoh yo`q. Birinchi bo`ling!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={post.id}
              postAuthorId={post.author.id}
            />
          ))}
          {hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                loading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                Ko`proq izoh
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
