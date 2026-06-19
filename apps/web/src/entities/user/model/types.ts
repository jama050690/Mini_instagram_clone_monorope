/** Backend `UserCard` (user-card.serializer.ts) — qidiruv/ro'yxat qatorlari. */
export interface UserCard {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
}

/** Backend `PublicUser` (user.serializer.ts) bilan mos. */
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}
