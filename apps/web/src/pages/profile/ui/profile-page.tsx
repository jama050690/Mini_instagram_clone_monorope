import { Lock, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { FollowButton } from '@/features/follow';
import { PostGrid } from '@/features/post';
import { ProfileHeader, useProfile } from '@/features/profile';
import { getApiErrorMessage } from '@/shared/api';

export function ProfilePage() {
  const { username = '' } = useParams();
  const { data: profile, isLoading, error } = useProfile(username);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        {error ? getApiErrorMessage(error, 'Foydalanuvchi topilmadi') : 'Foydalanuvchi topilmadi'}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileHeader
        profile={profile}
        followButton={
          <FollowButton
            username={profile.username}
            relationship={profile.relationship}
          />
        }
      />
      <hr className="border-border" />

      {profile.canViewPosts ? (
        <PostGrid username={profile.username} />
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Lock className="size-8 text-muted-foreground" />
          <p className="font-medium">Bu akkaunt maxfiy</p>
          <p className="text-sm text-muted-foreground">
            Postlarni ko`rish uchun obuna bo`ling.
          </p>
        </div>
      )}
    </div>
  );
}
