import { Images, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthedMedia } from './authed-media';
import type { Post } from '../model/types';

/** Profil grid'idagi kvadrat thumbnail — birinchi media + tur belgisi. */
export function PostThumb({ post }: { post: Post }) {
  const cover = post.media[0];
  return (
    <Link
      to={`/p/${post.id}`}
      className="relative aspect-square overflow-hidden rounded-md bg-muted"
    >
      {cover ? (
        <AuthedMedia
          media={cover}
          controls={false}
          className="size-full object-cover"
        />
      ) : null}
      {post.type === 'CAROUSEL' ? (
        <Images className="absolute right-1.5 top-1.5 size-4 text-white drop-shadow-md" />
      ) : null}
      {post.type === 'VIDEO' ? (
        <Play className="absolute right-1.5 top-1.5 size-4 fill-white text-white drop-shadow-md" />
      ) : null}
    </Link>
  );
}
