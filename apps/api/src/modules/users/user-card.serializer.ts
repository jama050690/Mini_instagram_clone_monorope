import { User } from '@prisma/client';

/**
 * Foydalanuvchining yengil "karta" ko'rinishi — qidiruv va follower/following
 * ro'yxatlarida ishlatiladi. Postlar yoki maxfiy maydonlar yo'q.
 */
export interface UserCard {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
}

export function toUserCard(user: User): UserCard {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isPrivate: user.isPrivate,
  };
}
