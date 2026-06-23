import { Hash, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PostThumb } from '@/entities/post';
import { useHashtagPosts } from '@/features/hashtags';
import { Button } from '@/shared/ui';

export function HashtagPage() {
  const { tag = '' } = useParams();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useHashtagPosts(tag);

  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  const meta = data?.pages[0];
  const postCount = meta?.postCount ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header — hashtag chip */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/80 px-6 py-8 shadow backdrop-blur-sm">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)' }}
        >
          <Hash className="size-8" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">#{tag}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {postCount.toLocaleString()} ta post
          </p>
        </div>

        {/* Tag chip — dekorative */}
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow"
          style={{ background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}
        >
          <Hash className="size-3.5" />
          {tag}
        </div>
      </div>

      {/* Posts grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-violet-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/80 py-16 text-center shadow">
          <Hash className="size-10 text-gray-300" />
          <p className="text-gray-500">Bu hashtag bo`yicha post topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <PostThumb key={post.id} post={post} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage
                  ? <Loader2 className="size-4 animate-spin" />
                  : 'Ko`proq yuklash'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
