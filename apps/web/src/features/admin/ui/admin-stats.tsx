import { Loader2 } from 'lucide-react';
import { useAdminStats } from '../api/use-admin';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function AdminStats() {
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Foydalanuvchilar" value={data.totalUsers} />
      <StatCard label="Bloklangan" value={data.blockedUsers} />
      <StatCard label="Postlar" value={data.totalPosts} />
      <StatCard label="Izohlar" value={data.totalComments} />
      <StatCard label="Yangi user (7k)" value={data.newUsers7d} />
      <StatCard label="Yangi post (7k)" value={data.newPosts7d} />
      <StatCard label="Private" value={data.privateUsers} />
      <StatCard label="Public" value={data.publicUsers} />
    </div>
  );
}
