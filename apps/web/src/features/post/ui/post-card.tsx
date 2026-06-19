import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthedMedia, type Post } from '@/entities/post';
import { UserAvatar } from '@/entities/user';
import { useAuthStore } from '@/features/auth';
import { getApiErrorMessage } from '@/shared/api';
import { Button, Textarea } from '@/shared/ui';
import { useDeletePost, useUpdateCaption } from '../api/use-post';
import { CAPTION_MAX_LENGTH } from '../model/validation';

export function PostCard({ post }: { post: Post }) {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwner = currentUserId === post.author.id;

  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption ?? '');

  const updateCaption = useUpdateCaption(post.id);
  const deletePost = useDeletePost();

  const media = post.media[index] ?? post.media[0];
  const isCarousel = post.media.length > 1;

  function handleDelete() {
    if (!window.confirm('Postni o`chirishni tasdiqlaysizmi?')) return;
    deletePost.mutate(post.id, {
      onSuccess: () => navigate(`/u/${post.author.username}`),
    });
  }

  function handleSaveCaption() {
    updateCaption.mutate(caption.trim(), {
      onSuccess: () => setEditing(false),
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border">
      <header className="flex items-center justify-between gap-2 p-3">
        <Link
          to={`/u/${post.author.username}`}
          className="flex items-center gap-2"
        >
          <UserAvatar user={{ ...post.author, fullName: post.author.username }} className="size-8" />
          <span className="text-sm font-semibold">{post.author.username}</span>
        </Link>
        {isOwner ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Caption tahrirlash"
              onClick={() => {
                setCaption(post.caption ?? '');
                setEditing((v) => !v);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="O`chirish"
              loading={deletePost.isPending}
              onClick={handleDelete}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ) : null}
      </header>

      <div className="relative aspect-square bg-muted">
        {media ? (
          <AuthedMedia media={media} className="size-full object-contain" />
        ) : null}
        {isCarousel ? (
          <>
            <button
              type="button"
              aria-label="Oldingi"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1 disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Keyingi"
              disabled={index === post.media.length - 1}
              onClick={() =>
                setIndex((i) => Math.min(post.media.length - 1, i + 1))
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1 disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {post.media.map((m, i) => (
                <span
                  key={m.id}
                  className={
                    i === index
                      ? 'size-1.5 rounded-full bg-primary'
                      : 'size-1.5 rounded-full bg-muted-foreground/40'
                  }
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-3 p-3">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={caption}
              maxLength={CAPTION_MAX_LENGTH}
              rows={3}
              onChange={(e) => setCaption(e.target.value)}
            />
            {updateCaption.error ? (
              <p className="text-sm text-destructive">
                {getApiErrorMessage(updateCaption.error)}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                size="sm"
                loading={updateCaption.isPending}
                onClick={handleSaveCaption}
              >
                Saqlash
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Bekor
              </Button>
            </div>
          </div>
        ) : post.caption ? (
          <p className="whitespace-pre-line text-sm">
            <span className="font-semibold">{post.author.username}</span>{' '}
            {post.caption}
          </p>
        ) : null}
      </div>
    </article>
  );
}
