import { Link } from 'react-router-dom';
import { GoogleButton, LoginForm } from '@/features/auth';
import { AuthShell } from '@/shared/ui';

export function LoginPage() {
  return (
    <AuthShell
      title="Kirish"
      description="Akkauntingizga kiring"
      footer={
        <>
          Akkauntingiz yo`qmi?{' '}
          <Link to="/register" className="font-medium text-foreground hover:underline">
            Ro`yxatdan o`ting
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <LoginForm />
        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-card px-2">yoki</span>
          <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
        </div>
        <GoogleButton />
      </div>
    </AuthShell>
  );
}
