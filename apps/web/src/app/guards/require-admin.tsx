import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { FullScreenSpinner } from '@/shared/ui';

/** Faqat ADMIN rolidagi foydalanuvchilar uchun (aks holda bosh sahifaga). */
export function RequireAdmin() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'guest') return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <Outlet />;
}
