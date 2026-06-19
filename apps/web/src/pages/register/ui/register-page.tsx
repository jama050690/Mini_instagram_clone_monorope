import { Link } from 'react-router-dom';
import { GoogleButton, RegisterForm } from '@/features/auth';
import { AuthShell } from '@/shared/ui';

export function RegisterPage() {
  return (
    <AuthShell
      title="Ro`yxatdan o`tish"
      description="Yangi akkaunt yarating"
      footer={
        <>
          Akkauntingiz bormi?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Kiring
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <RegisterForm />
        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-card px-2">yoki</span>
          <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
        </div>
        <GoogleButton />
      </div>
    </AuthShell>
  );
}
