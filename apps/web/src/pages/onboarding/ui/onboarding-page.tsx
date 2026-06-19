import { Navigate, useSearchParams } from 'react-router-dom';
import { OnboardingForm } from '@/features/auth';
import { AuthShell } from '@/shared/ui';

export function OnboardingPage() {
  const [params] = useSearchParams();
  const registrationToken = params.get('registrationToken');

  // Token bo'lmasa onboarding mantiqsiz — login'ga qaytaramiz.
  if (!registrationToken) return <Navigate to="/login" replace />;

  return (
    <AuthShell
      title="Profilni yakunlang"
      description="Google bilan kirdingiz. Endi username tanlang."
    >
      <OnboardingForm registrationToken={registrationToken} />
    </AuthShell>
  );
}
