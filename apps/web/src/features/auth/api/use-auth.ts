import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/shared/api';
import { registerPushSubscription } from '@/features/push/use-push-subscribe';
import { useAuthStore } from '../model/auth.store';
import {
  googleCompleteRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  type AuthResult,
} from './auth.api';

function useSessionSetter() {
  return useAuthStore((s) => s.setSession);
}

function afterLogin(setSession: (user: AuthResult['user'], token: string) => void) {
  return (res: AuthResult) => {
    setSession(res.user, res.accessToken);
    registerPushSubscription();
  };
}

export function useLoginMutation() {
  const setSession = useSessionSetter();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: afterLogin(setSession),
  });
}

export function useRegisterMutation() {
  const setSession = useSessionSetter();
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: afterLogin(setSession),
  });
}

export function useGoogleCompleteMutation() {
  const setSession = useSessionSetter();
  return useMutation({
    mutationFn: googleCompleteRequest,
    onSuccess: (res: AuthResult) => setSession(res.user, res.accessToken),
  });
}

export function useLogoutMutation() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: logoutRequest,
    // Logout serverda muvaffaqiyatsiz bo'lsa ham, lokal sessiyani tozalaymiz.
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
