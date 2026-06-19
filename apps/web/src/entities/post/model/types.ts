/** Backend `PostView` (post.serializer.ts) bilan mos. */
export type PostType = 'IMAGE' | 'CAROUSEL' | 'VIDEO';
export type MediaKind = 'IMAGE' | 'VIDEO';

export interface PostMedia {
  id: string;
  kind: MediaKind;
  order: number;
  /** Avtorizatsiyali `GET /api/v1/media/:id` — to'g'ridan-to'g'ri <img src> emas. */
  url: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Post {
  id: string;
  author: PostAuthor;
  caption: string | null;
  type: PostType;
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}
