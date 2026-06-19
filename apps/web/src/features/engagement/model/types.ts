/** Backend `CommentView` (comment.serializer.ts) bilan mos. */
export interface CommentAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  text: string;
  createdAt: string;
}
