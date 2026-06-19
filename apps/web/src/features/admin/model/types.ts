/** Backend `AdminStats` (admin.serializer.ts) bilan mos. */
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

/** Backend `AdminUserView`. */
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isPrivate: boolean;
  isBlocked: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}
