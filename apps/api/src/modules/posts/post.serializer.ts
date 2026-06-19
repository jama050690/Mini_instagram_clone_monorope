import { MediaKind, Prisma, PostType } from '@prisma/client';

/**
 * Post DTO (SRS 4.4). `media[].url` → avtorizatsiyali `GET /api/v1/media/:id`
 * (ochiq static yo'q). `likeCount/commentCount/likedByMe` — Engagement (M4.5),
 * lekin jadvallar mavjud bo'lgani uchun shu yerda to'g'ri hisoblanadi.
 */
export interface PostAuthorView {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface PostMediaView {
  id: string;
  kind: MediaKind;
  order: number;
  url: string;
}

export interface PostView {
  id: string;
  author: PostAuthorView;
  caption: string | null;
  type: PostType;
  media: PostMediaView[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: Date;
}

/**
 * Serializer uchun kerakli relation/aggregatsiyalar (single manba).
 * `isPrivate`/`isBlocked` faqat ichki maxfiylik tekshiruvi uchun — `PostView`ga
 * chiqmaydi (`toPostView` faqat id/username/avatarUrl o'qiydi).
 */
export const postInclude = {
  author: {
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      isPrivate: true,
      isBlocked: true,
    },
  },
  media: { orderBy: { order: 'asc' } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

/** `postInclude` + viewer like'ini olib keluvchi to'liq include. */
export function postIncludeFor(viewerId: string): Prisma.PostInclude {
  return {
    ...postInclude,
    likes: { where: { userId: viewerId }, select: { id: true }, take: 1 },
  };
}

type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postInclude;
}> & { likes?: { id: string }[] };

/** Prisma post (relations bilan) → commaviy `PostView`. */
export function toPostView(post: PostWithRelations): PostView {
  return {
    id: post.id,
    author: {
      id: post.author.id,
      username: post.author.username,
      avatarUrl: post.author.avatarUrl,
    },
    caption: post.caption,
    type: post.type,
    media: post.media.map((m) => ({
      id: m.id,
      kind: m.kind,
      order: m.order,
      url: `/api/v1/media/${m.id}`,
    })),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: (post.likes?.length ?? 0) > 0,
    createdAt: post.createdAt,
  };
}
