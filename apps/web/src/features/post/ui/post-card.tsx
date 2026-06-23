import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const updateCaption = useUpdateCaption(post.id);
  const deletePost = useDeletePost();

  const media = post.media[index] ?? post.media[0];
  const isCarousel = post.media.length > 1;

  function handleDelete() {
    setMenuOpen(false);
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
    <article className="border-b border-neutral-200 bg-white pb-2">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link to={`/u/${post.author.username}`} className="flex items-center gap-3">
          <UserAvatar
            user={{ ...post.author, fullName: post.author.username }}
            className="size-8"
          />
          <div>
            <p className="text-sm font-semibold leading-tight">{post.author.username}</p>
          </div>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 text-neutral-800"
            >
              <MoreHorizontal className="size-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setCaption(post.caption ?? ''); setEditing(true); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  <Pencil className="size-4" /> Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-neutral-50"
                >
                  <Trash2 className="size-4" /> O`chirish
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Media */}
      <div className="relative aspect-square bg-black">
        {media ? (
          <AuthedMedia media={media} className="size-full object-contain" />
        ) : null}
        {isCarousel && (
          <>
            <button
              type="button"
              aria-label="Oldingi"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Keyingi"
              disabled={index === post.media.length - 1}
              onClick={() => setIndex((i) => Math.min(post.media.length - 1, i + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {post.media.map((m, i) => (
                <span
                  key={m.id}
                  className={
                    i === index
                      ? 'size-1.5 rounded-full bg-white'
                      : 'size-1.5 rounded-full bg-white/40'
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 pt-2">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={caption}
              maxLength={CAPTION_MAX_LENGTH}
              rows={3}
              onChange={(e) => setCaption(e.target.value)}
              className="text-sm"
            />
            {updateCaption.error && (
              <p className="text-xs text-red-500">{getApiErrorMessage(updateCaption.error)}</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" loading={updateCaption.isPending} onClick={handleSaveCaption}>
                Saqlash
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Bekor
              </Button>
            </div>
          </div>
        ) : post.caption ? (
          <p className="whitespace-pre-line text-sm leading-snug">
            <span className="font-semibold">{post.author.username}</span>{' '}
            {post.caption}
          </p>
        ) : null}
      </div>
    </article>
  );
}
