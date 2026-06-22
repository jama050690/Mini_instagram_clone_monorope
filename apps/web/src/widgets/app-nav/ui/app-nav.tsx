import {
  Bell,
  Home,
  LogOut,
  PlusSquare,
  Search,
  Settings,
  Shield,
  User,
  UserPlus,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { useAuthStore, useLogoutMutation } from '@/features/auth';
import { useUnreadCount } from '@/features/notifications';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
    isActive ? 'text-foreground' : 'text-muted-foreground',
  );

/** Autentifikatsiyalangan sahifalar uchun umumiy layout — yuqori navigatsiya + outlet. */
export function AppNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogoutMutation();
  const { data: unreadCount = 0 } = useUnreadCount();
  if (!user) return null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <Link to="/" className="text-lg font-bold">
            Instagram MVP
          </Link>
          <div className="flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              <Home className="size-4" />
              <span className="hidden sm:inline">Bosh</span>
            </NavLink>
            <NavLink to="/search" className={linkClass}>
              <Search className="size-4" />
              <span className="hidden sm:inline">Qidiruv</span>
            </NavLink>
            <NavLink to="/create" className={linkClass}>
              <PlusSquare className="size-4" />
              <span className="hidden sm:inline">Yangi</span>
            </NavLink>
            <NavLink to="/requests" className={linkClass}>
              <UserPlus className="size-4" />
              <span className="hidden sm:inline">So`rovlar</span>
            </NavLink>
            <NavLink to="/notifications" className={linkClass}>
              <span className="relative">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">Xabarnoma</span>
            </NavLink>
            <NavLink to={`/u/${user.username}`} className={linkClass}>
              <User className="size-4" />
              <span className="hidden sm:inline">Profil</span>
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              <Settings className="size-4" />
              <span className="hidden sm:inline">Sozlamalar</span>
            </NavLink>
            {user.role === 'ADMIN' ? (
              <NavLink to="/admin" className={linkClass}>
                <Shield className="size-4" />
                <span className="hidden sm:inline">Admin</span>
              </NavLink>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              title="Chiqish"
              loading={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut className="size-4" />
            </Button>
            <UserAvatar user={user} className="size-8" />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
