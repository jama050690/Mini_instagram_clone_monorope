import { cn } from '@/shared/lib/cn';
import type { User } from '../model/types';

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

interface UserAvatarProps {
  user: Pick<User, 'fullName' | 'avatarUrl' | 'username'>;
  className?: string;
}

/** Avatar — rasm bo'lsa ko'rsatadi, aks holda ism bosh harflari. */
export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex size-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="size-full object-cover"
        />
      ) : (
        initials(user.fullName)
      )}
    </span>
  );
}
