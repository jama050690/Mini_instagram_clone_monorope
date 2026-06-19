import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { FullScreenSpinner } from '@/shared/ui';

/** Faqat autentifikatsiyalangan foydalanuvchilar uchun (aks holda /login). */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'guest') return <Navigate to="/login" replace />;
  return <Outlet />;
}
