import { Prisma } from '@prisma/client';

/** Comment DTO (SRS 4.5) — flat, reply yo'q. */
export interface CommentAuthorView {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface CommentView {
  id: string;
  author: CommentAuthorView;
  text: string;
  createdAt: Date;
}

/** Serializer uchun kerakli author select (single manba). */
export const commentInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
} satisfies Prisma.CommentInclude;

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

export function toCommentView(comment: CommentWithAuthor): CommentView {
  return {
    id: comment.id,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      avatarUrl: comment.author.avatarUrl,
    },
    text: comment.text,
    createdAt: comment.createdAt,
  };
}
