export type Relationship = 'self' | 'following' | 'requested' | 'none';

export interface ProfileCounts {
  posts: number;
  followers: number;
  following: number;
}

/** Backend `ProfileView` (profile-view.serializer.ts) bilan mos. */
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
