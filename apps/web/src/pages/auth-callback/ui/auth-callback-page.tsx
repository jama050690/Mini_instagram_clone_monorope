import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFinishGoogleLogin } from '@/features/auth';
import { FullScreenSpinner } from '@/shared/ui';

/**
 * Google OAuth callback. Backend bu yerga `?accessToken=` (kirish) yoki
 * `?onboarding=1&registrationToken=` (username tanlash) bilan qaytaradi.
 */
export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const finishLogin = useFinishGoogleLogin();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const registrationToken = params.get('registrationToken');
    if (params.get('onboarding') && registrationToken) {
      navigate(`/onboarding/username?registrationToken=${encodeURIComponent(registrationToken)}`, {
        replace: true,
      });
      return;
    }

    const accessToken = params.get('accessToken');
    if (accessToken) {
      finishLogin(accessToken)
        .then(() => navigate('/', { replace: true }))
        .catch(() => navigate('/login', { replace: true }));
      return;
    }

    navigate('/login', { replace: true });
  }, [params, navigate, finishLogin]);

  return <FullScreenSpinner />;
}
