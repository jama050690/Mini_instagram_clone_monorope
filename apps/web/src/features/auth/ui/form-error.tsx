import { getApiErrorMessage } from '@/shared/api';

/** Server xatosini (mutation.error) ko'rsatadigan banner. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {getApiErrorMessage(error)}
    </p>
  );
}

/** Maydon validatsiya xatosi (react-hook-form). */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
