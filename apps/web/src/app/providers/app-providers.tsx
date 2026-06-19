import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAuthBootstrap } from '@/features/auth';
import { queryClient } from '@/shared/api';

/** App yuklanganda sessiyani tiklaydi (refresh cookie orqali). */
function AuthBootstrap({ children }: { children: ReactNode }) {
  useAuthBootstrap();
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryClientProvider>
  );
}
