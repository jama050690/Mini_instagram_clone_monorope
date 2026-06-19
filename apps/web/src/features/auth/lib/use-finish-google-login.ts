import { useCallback } from 'react';
import { setAccessToken } from '@/shared/api';
import { meRequest } from '../api/auth.api';
import { useAuthStore } from '../model/auth.store';

/**
 * Google callback'dan kelgan access token bilan sessiyani yakunlaydi: token'ni
 * o'rnatadi, `/auth/me` orqali user'ni oladi va store'ni to'ldiradi.
 */
export function useFinishGoogleLogin(): (accessToken: string) => Promise<void> {
  const setSession = useAuthStore((s) => s.setSession);
  return useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken);
      const user = await meRequest();
      setSession(user, accessToken);
    },
    [setSession],
  );
}
