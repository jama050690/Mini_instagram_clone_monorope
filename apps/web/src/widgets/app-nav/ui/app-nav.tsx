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

export function AppNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogoutMutation();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-dvh" style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #fce4ec 40%, #e3f2fd 100%)' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 border-b border-white/50 backdrop-blur-md"
        style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.12) 50%, rgba(59,130,246,0.12) 100%)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mr-4 flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)' }}
          >
            <span className="text-lg">📷</span>
          </button>

          {/* Nav links */}
          <nav className="flex flex-1 items-center gap-1">
            <NavItem to="/" icon={Home} label="Bosh sahifa" end />
            <NavItem to="/search" icon={Search} label="Qidiruv" />
            <NavItem to="/create" icon={PlusSquare} label="Yangi post" />
            <NavItem to="/requests" icon={UserPlus} label="So'rovlar" />
            <NavItem
              to="/notifications"
              icon={Bell}
              label="Bildirishnomalar"
              badge={unreadCount}
            />
            {isAdmin && <NavItem to="/admin" icon={Shield} label="Admin" />}
            <NavItem to={`/u/${user.username}`} icon={Compass} label="Profil" />
            <NavItem to="/settings" icon={Settings} label="Sozlamalar" />
          </nav>

          {/* Right: avatar + logout */}
          <div className="flex items-center gap-2 pl-2">
            <NavLink
              to={`/u/${user.username}`}
              className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 shadow-sm transition-all hover:bg-white/90"
            >
              <UserAvatar user={user} className="size-7" />
              <span className="hidden text-sm font-semibold text-gray-800 sm:block">
                {user.username}
              </span>
            </NavLink>
            <button
              type="button"
              onClick={() => logout.mutate()}
              title="Chiqish"
              className="rounded-full bg-white/60 p-2 text-gray-600 shadow-sm transition-all hover:bg-red-100 hover:text-red-500"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  badge?: number;
}

function NavItem({ to, icon: Icon, label, end, badge = 0 }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-white/80 text-violet-600 shadow-sm'
            : 'text-gray-600 hover:bg-white/50 hover:text-gray-900',
        )
      }
    >
      <span className="relative">
        <Icon className="size-5" />
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm transition-all duration-200 group-hover:max-w-[120px]">
        {label}
      </span>
    </NavLink>
  );
}
