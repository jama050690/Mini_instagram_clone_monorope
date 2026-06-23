import {
  Bell,
  Compass,
  Home,
  LogOut,
  PlusSquare,
  Search,
  Settings,
  Shield,
  UserPlus,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserAvatar } from '@/entities/user';
import { useAuthStore, useLogoutMutation } from '@/features/auth';
import { useUnreadCount } from '@/features/notifications';
import { cn } from '@/shared/lib/cn';

const NAV_ITEMS = (username: string, isAdmin: boolean) => [
  { to: '/', icon: Home, label: 'Bosh sahifa', end: true },
  { to: '/search', icon: Search, label: 'Qidiruv' },
  { to: '/create', icon: PlusSquare, label: 'Yaratish' },
  { to: '/requests', icon: UserPlus, label: 'So\'rovlar' },
  { to: '/notifications', icon: Bell, label: 'Bildirishnomalar' },
  ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  { to: `/u/${username}`, icon: Compass, label: 'Profil' },
];

export function AppNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogoutMutation();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();

  if (!user) return null;

  const items = NAV_ITEMS(user.username, user.role === 'ADMIN');

  return (
    <div className="flex min-h-dvh bg-white">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[72px] flex-col border-r border-neutral-200 bg-white px-3 py-6 xl:w-[245px] md:flex">
        {/* Logo */}
        <div
          className="mb-8 flex cursor-pointer items-center gap-3 px-2"
          onClick={() => navigate('/')}
        >
          <span className="text-2xl">📷</span>
          <span className="hidden text-xl font-semibold tracking-tight xl:block">
            Instagram
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-medium transition-all hover:bg-neutral-100',
                  isActive ? 'font-semibold' : 'text-neutral-800',
                )
              }
            >
              {label === 'Bildirishnomalar' ? (
                <span className="relative">
                  <Icon className="size-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
              ) : (
                <Icon className="size-6 shrink-0" />
              )}
              <span className="hidden xl:block">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: Settings + Logout + Avatar */}
        <div className="flex flex-col gap-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-medium transition-all hover:bg-neutral-100',
                isActive ? 'font-semibold' : 'text-neutral-800',
              )
            }
          >
            <Settings className="size-6 shrink-0" />
            <span className="hidden xl:block">Sozlamalar</span>
          </NavLink>
          <button
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-sm font-medium text-neutral-800 transition-all hover:bg-neutral-100"
          >
            <LogOut className="size-6 shrink-0" />
            <span className="hidden xl:block">Chiqish</span>
          </button>
          <NavLink
            to={`/u/${user.username}`}
            className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-neutral-100"
          >
            <UserAvatar user={user} className="size-7 shrink-0" />
            <div className="hidden min-w-0 xl:block">
              <p className="truncate text-sm font-semibold">{user.username}</p>
              <p className="truncate text-xs text-neutral-500">{user.fullName}</p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 pb-16 md:pb-0 md:pl-[72px] xl:pl-[245px]">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-neutral-200 bg-white px-2 py-2 md:hidden">
        {items.slice(0, 5).map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1',
                isActive ? 'text-black' : 'text-neutral-500',
              )
            }
          >
            {label === 'Bildirishnomalar' ? (
              <span className="relative">
                <Icon className="size-6" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
            ) : (
              <Icon className="size-6" />
            )}
          </NavLink>
        ))}
        <NavLink
          to={`/u/${user.username}`}
          className={({ isActive }) =>
            cn('flex flex-col items-center', isActive ? 'text-black' : 'text-neutral-500')
          }
        >
          <UserAvatar user={user} className="size-7" />
        </NavLink>
      </nav>
    </div>
  );
}
