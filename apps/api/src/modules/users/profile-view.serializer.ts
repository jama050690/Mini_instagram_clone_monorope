import { User } from '@prisma/client';

/** Viewer'ning target profilga munosabati. */
export type Relationship = 'self' | 'following' | 'requested' | 'none';

export interface ProfileCounts {
  posts: number;
  followers: number;
  following: number;
}

/**
 * Profil ko'rish javobi (`GET /users/:username`). Maxfiy maydonlar (email,
 * passwordHash, googleId) hech qachon chiqmaydi. `canViewPosts=false` bo'lsa
 * FE postlarni so'ramaydi ("Ko'rish uchun obuna bo'ling").
 */
export interface ProfileView {
  id: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  counts: ProfileCounts;
  relationship: Relationship;
  canViewPosts: boolean;
}

export function toProfileView(
  user: User,
  counts: ProfileCounts,
  relationship: Relationship,
  canViewPosts: boolean,
): ProfileView {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    isPrivate: user.isPrivate,
    counts,
    relationship,
    canViewPosts,
  };
}
