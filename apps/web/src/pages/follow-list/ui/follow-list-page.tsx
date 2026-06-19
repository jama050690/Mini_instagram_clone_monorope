import { Link, useParams } from 'react-router-dom';
import { UserList, useFollowers, useFollowing } from '@/features/profile';
import { getApiErrorCode } from '@/shared/api';
import { cn } from '@/shared/lib/cn';

type FollowListType = 'followers' | 'following';

const tabClass = (active: boolean) =>
  cn(
    'flex-1 border-b-2 pb-2 text-center text-sm font-medium',
    active ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground',
  );

export function FollowListPage({ type }: { type: FollowListType }) {
  const { username = '' } = useParams();
  const followers = useFollowers(type === 'followers' ? username : '');
  const following = useFollowing(type === 'following' ? username : '');
  const query = type === 'followers' ? followers : following;

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const forbidden = getApiErrorCode(query.error) === 'FORBIDDEN';

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-lg font-semibold">
        <Link to={`/u/${username}`} className="hover:underline">
          {username}
        </Link>
      </h1>

      <div className="flex">
        <Link to={`/u/${username}/followers`} className={tabClass(type === 'followers')}>
          Obunachilar
        </Link>
        <Link to={`/u/${username}/following`} className={tabClass(type === 'following')}>
          Obunalar
        </Link>
      </div>

      {forbidden ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Bu ro`yxat faqat tasdiqlangan obunachilarga ko`rinadi.
        </p>
      ) : (
        <UserList
          items={items}
          isLoading={query.isLoading}
          hasNextPage={!!query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
          onLoadMore={() => void query.fetchNextPage()}
          emptyText={type === 'followers' ? 'Obunachilar yo`q' : 'Obunalar yo`q'}
        />
      )}
    </div>
  );
}
