import { User } from '@prisma/client';

/**
 * Foydalanuvchining ommaviy (xavfsiz) ko'rinishi — `passwordHash`, `googleId`
 * kabi maxfiy maydonlar hech qachon qaytarilmaydi.
 */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  role: User['role'];
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isPrivate: user.isPrivate,
    role: user.role,
    createdAt: user.createdAt,
  };
}
