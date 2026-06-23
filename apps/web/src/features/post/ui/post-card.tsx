import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthedMedia, type Post } from '@/entities/post';
import { UserAvatar } from '@/entities/user';
import { useAuthStore } from '@/features/auth';
import { CaptionText } from '@/features/hashtags';
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
    <article className="overflow-hidden rounded-2xl bg-white/90 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg">
      {/* Gradient top accent */}
      <div
        className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b)' }}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <Link to={`/u/${post.author.username}`} className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
            <div className="rounded-full bg-white p-[1.5px]">
              <UserAvatar user={{ ...post.author, fullName: post.author.username }} className="size-8" />
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-900">{post.author.username}</span>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <MoreHorizontal className="size-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-10 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setCaption(post.caption ?? ''); setEditing(true); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="size-4" /> Tahrirlash
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="size-4" /> O`chirish
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Media */}
      <div className="relative aspect-square bg-gray-900">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-md backdrop-blur-sm disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Keyingi"
              disabled={index === post.media.length - 1}
              onClick={() => setIndex((i) => Math.min(post.media.length - 1, i + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 shadow-md backdrop-blur-sm disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {post.media.map((m, i) => (
                <span
                  key={m.id}
                  className={cn(
                    'size-1.5 rounded-full transition-all',
                    i === index ? 'scale-125 bg-white' : 'bg-white/50',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 pb-4 pt-3">
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
          <CaptionText
            username={post.author.username}
            caption={post.caption}
            className="whitespace-pre-line text-sm leading-relaxed text-gray-800"
          />
        ) : null}
      </div>
    </article>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
