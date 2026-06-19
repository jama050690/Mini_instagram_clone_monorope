import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/shared/api';
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

export function useLoginMutation() {
  const setSession = useSessionSetter();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (res: AuthResult) => setSession(res.user, res.accessToken),
  });
}

export function useRegisterMutation() {
  const setSession = useSessionSetter();
  return useMutation({
    mutationFn: registerRequest,
    onSuccess: (res: AuthResult) => setSession(res.user, res.accessToken),
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
