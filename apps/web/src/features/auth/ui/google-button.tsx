import { Button } from '@/shared/ui';

/**
 * Google OAuth boshlanishi — to'liq sahifa navigatsiyasi (axios emas), chunki
 * bu brauzer redirect oqimi. Backend `/auth/callback`ga qaytaradi.
 */
export function GoogleButton({ label = 'Google bilan davom etish' }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = '/api/v1/auth/google';
      }}
    >
      {label}
    </Button>
  );
}
