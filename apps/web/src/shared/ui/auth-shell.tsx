import type { ReactNode } from 'react';

interface AuthShellProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ description, children, footer }: AuthShellProps) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #fce4ec 40%, #e3f2fd 100%)' }}
    >
      <div className="w-full max-w-[380px] space-y-4">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white/90 shadow-xl backdrop-blur-sm">
          {/* Gradient top strip */}
          <div
            className="h-2 w-full"
            style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b)' }}
          />

          <div className="px-10 py-8">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <span
                className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 bg-clip-text text-4xl font-extrabold italic tracking-tight text-transparent"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Instagram
              </span>
            </div>

            {description && (
              <p className="mb-5 text-center text-sm font-medium text-gray-500">
                {description}
              </p>
            )}

            {children}
          </div>
        </div>

        {/* Footer card */}
        {footer && (
          <div className="rounded-2xl bg-white/80 py-4 text-center text-sm shadow backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
