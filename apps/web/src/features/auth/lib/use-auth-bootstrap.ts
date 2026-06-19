import { useEffect } from 'react';
import { setAuthFailureHandler } from '@/shared/api';
import { refreshRequest } from '../api/auth.api';
import { useAuthStore } from '../model/auth.store';

/**
 * Ilova yuklanganda sessiyani tiklaydi: refresh cookie orqali yangi access
 * token + user oladi. Muvaffaqiyatsiz bo'lsa — guest. Shuningdek interceptor
 * uchun "auth failure" handler'ini registratsiya qiladi (refresh tugaganda
 * sessiyani tozalaydi).
 */
export function useAuthBootstrap(): void {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    setAuthFailureHandler(() => clearSession());

    let active = true;
    refreshRequest()
      .then((res) => {
        if (active) setSession(res.user, res.accessToken);
      })
      .catch(() => {
        if (active) clearSession();
      });

    return () => {
      active = false;
      setAuthFailureHandler(null);
    };
  }, [setSession, clearSession]);
}
