import type { Relationship } from '@/features/profile';
import { Button } from '@/shared/ui';
import { useToggleFollow } from '../api/use-follow';

interface FollowButtonProps {
  username: string;
  relationship: Relationship;
}

const LABEL: Record<Exclude<Relationship, 'self'>, string> = {
  none: 'Obuna bo`lish',
  following: 'Obuna bo`lingan',
  requested: 'So`ralgan',
};

/** Profil follow tugmasi — holatga qarab follow/unfollow/cancel. */
export function FollowButton({ username, relationship }: FollowButtonProps) {
  const toggle = useToggleFollow(username);
  if (relationship === 'self') return null;

  const isFollowingOrRequested = relationship !== 'none';

  return (
    <Button
      size="sm"
      variant={isFollowingOrRequested ? 'outline' : 'default'}
      loading={toggle.isPending}
      onClick={() => toggle.mutate(relationship)}
    >
      {LABEL[relationship]}
    </Button>
  );
}
