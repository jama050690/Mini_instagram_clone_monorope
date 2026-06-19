import { useState } from 'react';
import { AdminPosts, AdminStats, AdminUsers } from '@/features/admin';
import { cn } from '@/shared/lib/cn';

type Tab = 'users' | 'posts';

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-foreground text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin panel</h1>
      <AdminStats />

      <div className="flex border-b border-border">
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          Foydalanuvchilar
        </TabButton>
        <TabButton active={tab === 'posts'} onClick={() => setTab('posts')}>
          Postlar (moderatsiya)
        </TabButton>
      </div>

      {tab === 'users' ? <AdminUsers /> : <AdminPosts />}
    </div>
  );
}
