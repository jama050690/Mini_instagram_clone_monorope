import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/** Markazlashtirilgan to'liq ekranli yuklash indikatori. */
export function FullScreenSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-dvh items-center justify-center', className)}>
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
