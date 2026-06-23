import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { Button } from '@/shared/ui';
import type { ProfileView } from '../model/types';

function Stat({ label, value, to }: { label: string; value: number; to?: string }) {
  const inner = (
    <div className="flex flex-col items-center text-center">
      <span className="text-base font-bold text-neutral-900">{value.toLocaleString()}</span>
      <span className="text-sm text-neutral-600">{label}</span>
    </div>
  );
  if (to) return <Link to={to} className="hover:opacity-70 transition-opacity">{inner}</Link>;
  return inner;
}

interface ProfileHeaderProps {
  profile: ProfileView;
  followButton?: ReactNode;
}

export function ProfileHeader({ profile, followButton }: ProfileHeaderProps) {
  const isSelf = profile.relationship === 'self';
  const canSeeStats = isSelf || !profile.isPrivate || profile.relationship === 'following';

  return (
    <header className="flex flex-col gap-6">
      {/* Top row: avatar + stats */}
      <div className="flex items-center gap-7 md:gap-16">
        {/* Avatar with gradient ring */}
        <div className="shrink-0">
          <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
            <div className="rounded-full bg-white p-[2px]">
              <UserAvatar user={profile} className="size-20 md:size-36" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Username row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl text-neutral-900">{profile.username}</h1>
            {profile.isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                <Lock className="size-3" /> Private
              </span>
            )}
            {isSelf ? (
              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg border-neutral-300 text-sm font-semibold">
                <Link to="/settings">Profilni tahrirlash</Link>
              </Button>
            ) : (
              followButton
            )}
          </div>

          {/* Stats row — desktop only */}
          <div className="hidden gap-8 md:flex">
            <Stat label="ta post" value={profile.counts.posts} />
            {canSeeStats ? (
              <>
                <Stat label="ta obunachilar" value={profile.counts.followers} to={`/u/${profile.username}/followers`} />
                <Stat label="ta obunalar" value={profile.counts.following} to={`/u/${profile.username}/following`} />
              </>
            ) : (
              <>
                <Stat label="ta obunachilar" value={profile.counts.followers} />
                <Stat label="ta obunalar" value={profile.counts.following} />
              </>
            )}
          </div>

          {/* Bio — desktop */}
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-neutral-900">{profile.fullName}</p>
            {profile.bio && <p className="whitespace-pre-line text-sm text-neutral-800">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Bio — mobile */}
      <div className="md:hidden">
        <p className="text-sm font-semibold text-neutral-900">{profile.fullName}</p>
        {profile.bio && <p className="whitespace-pre-line text-sm text-neutral-800">{profile.bio}</p>}
      </div>

      {/* Stats row — mobile */}
      <div className="flex justify-around border-y border-neutral-200 py-3 md:hidden">
        <Stat label="post" value={profile.counts.posts} />
        {canSeeStats ? (
          <>
            <Stat label="obunachi" value={profile.counts.followers} to={`/u/${profile.username}/followers`} />
            <Stat label="obuna" value={profile.counts.following} to={`/u/${profile.username}/following`} />
          </>
        ) : (
          <>
            <Stat label="obunachi" value={profile.counts.followers} />
            <Stat label="obuna" value={profile.counts.following} />
          </>
        )}
      </div>
    </header>
  );
}
