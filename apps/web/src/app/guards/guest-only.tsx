import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { FullScreenSpinner } from '@/shared/ui';

/** Faqat mehmonlar uchun (login/register) — kirgan bo'lsa bosh sahifaga. */
export function GuestOnly() {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
