import { FollowRequests } from '@/features/follow';

export function RequestsPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Follow so`rovlari</h1>
      <FollowRequests />
    </div>
  );
}
