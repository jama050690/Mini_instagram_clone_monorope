import { User } from '@prisma/client';
import { ProfileCounts } from '../users/profile-view.serializer';

/** Admin uchun foydalanuvchi ko'rinishi — email/role/isBlocked ham bor (PublicUser'dan kengroq). */
export interface AdminUserView {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  isBlocked: boolean;
  role: User['role'];
  createdAt: Date;
}

/** Bitta user batafsil ko'rinishi — counts bilan. */
export interface AdminUserDetail extends AdminUserView {
  counts: ProfileCounts;
}

export function toAdminUserView(user: User): AdminUserView {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isPrivate: user.isPrivate,
    isBlocked: user.isBlocked,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/** Dashboard statistikasi (SRS 4.8). */
export interface AdminStats {
  totalUsers: number;
  blockedUsers: number;
  totalPosts: number;
  totalComments: number;
  newUsers7d: number;
  newPosts7d: number;
  privateUsers: number;
  publicUsers: number;
}
