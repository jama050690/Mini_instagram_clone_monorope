import { create } from 'zustand';
import type { User } from '@/entities/user';
import { setAccessToken } from '@/shared/api';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** Kirish muvaffaqiyatli — user + access token o'rnatiladi. */
  setSession: (user: User, accessToken: string) => void;
  /** Joriy user ma'lumotini yangilaydi (profil tahrirdan keyin). */
  setUser: (user: User) => void;
  /** Sessiyani tugatadi (logout yoki refresh muvaffaqiyatsiz). */
  clearSession: () => void;
}

/**
 * Auth holati. Access token memory'da (shared/auth-token); store user va
 * status'ni ushlaydi. Refresh token httpOnly cookie'da — FE ko'rmaydi.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  setSession: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
  },
  setUser: (user) => set({ user }),
  clearSession: () => {
    setAccessToken(null);
    set({ user: null, status: 'guest' });
  },
}));
