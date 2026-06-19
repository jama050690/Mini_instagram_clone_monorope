import { useAuthStore } from '@/features/auth';
import { AvatarUploader, PrivacyToggle, ProfileEditForm } from '@/features/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Sozlamalar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profil rasmi</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUploader user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profil ma`lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileEditForm user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Maxfiylik</CardTitle>
        </CardHeader>
        <CardContent>
          <PrivacyToggle user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
