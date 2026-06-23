import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchHashtagPosts } from './hashtags.api';

export function useHashtagPosts(tag: string) {
  return useInfiniteQuery({
    queryKey: ['hashtag-posts', tag],
    queryFn: ({ pageParam }) =>
      fetchHashtagPosts(tag, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: tag.length > 0,
  });
}
