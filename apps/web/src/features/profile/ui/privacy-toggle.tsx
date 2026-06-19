import type { User } from '@/entities/user';
import { Button } from '@/shared/ui';
import { useSetPrivacy } from '../api/use-profile';

/** Public/Private rejimini almashtiradi. Private→Public da pending obunalar tasdiqlanadi (backend). */
export function PrivacyToggle({ user }: { user: User }) {
  const setPrivacy = useSetPrivacy();

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
      <div>
        <p className="text-sm font-medium">Maxfiy akkaunt</p>
        <p className="text-sm text-muted-foreground">
          {user.isPrivate
            ? 'Postlaringizni faqat tasdiqlangan obunachilar ko`radi.'
            : 'Profilingiz hammaga ochiq.'}
        </p>
      </div>
      <Button
        variant={user.isPrivate ? 'default' : 'outline'}
        size="sm"
        loading={setPrivacy.isPending}
        onClick={() => setPrivacy.mutate(!user.isPrivate)}
      >
        {user.isPrivate ? 'Ochiq qilish' : 'Maxfiy qilish'}
      </Button>
    </div>
  );
}
