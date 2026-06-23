import type { ReactNode } from 'react';

interface AuthShellProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-[350px] space-y-3">
        {/* Card */}
        <div className="border border-neutral-300 bg-white px-10 py-8">
          {/* Instagram gradient logo */}
          <div className="mb-8 flex justify-center">
            <span
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-4xl font-bold italic tracking-tight text-transparent"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Instagram
            </span>
          </div>

          {description && (
            <p className="mb-4 text-center text-sm font-semibold text-neutral-500">
              {description}
            </p>
          )}

          {children}
        </div>

        {/* Footer card */}
        {footer && (
          <div className="border border-neutral-300 bg-white py-4 text-center text-sm">
            {footer}
          </div>
        )}

        {/* App store links */}
        <p className="text-center text-xs text-neutral-400">
          Ilovani yuklab oling
        </p>
        <div className="flex justify-center gap-3">
          <div className="rounded border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600">
            App Store
          </div>
          <div className="rounded border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600">
            Google Play
          </div>
        </div>
      </div>
    </div>
  );
}
