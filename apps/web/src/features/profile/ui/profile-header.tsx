import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { Button } from '@/shared/ui';
import type { ProfileView } from '../model/types';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-center">
      <span className="font-semibold">{value}</span>{' '}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

interface ProfileHeaderProps {
  profile: ProfileView;
  /** Boshqa user profilida ko'rsatiladigan follow tugmasi (page uzatadi). */
  followButton?: ReactNode;
}

export function ProfileHeader({ profile, followButton }: ProfileHeaderProps) {
  const isSelf = profile.relationship === 'self';
  const canSeeStats = isSelf || !profile.isPrivate || profile.relationship === 'following';

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <UserAvatar user={profile} className="size-20 sm:size-28" />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{profile.username}</h1>
          {profile.isPrivate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Lock className="size-3" /> Private
            </span>
          ) : null}
          {isSelf ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">Profilni tahrirlash</Link>
            </Button>
          ) : (
            followButton
          )}
        </div>

        <div className="flex gap-6 text-sm">
          <Stat label="post" value={profile.counts.posts} />
          {canSeeStats ? (
            <>
              <Link to={`/u/${profile.username}/followers`} className="hover:underline">
                <Stat label="obunachi" value={profile.counts.followers} />
              </Link>
              <Link to={`/u/${profile.username}/following`} className="hover:underline">
                <Stat label="obuna" value={profile.counts.following} />
              </Link>
            </>
          ) : (
            <>
              <Stat label="obunachi" value={profile.counts.followers} />
              <Stat label="obuna" value={profile.counts.following} />
            </>
          )}
        </div>

        <div>
          <p className="font-medium">{profile.fullName}</p>
          {profile.bio ? <p className="whitespace-pre-line text-sm">{profile.bio}</p> : null}
        </div>
      </div>
    </header>
  );
}
