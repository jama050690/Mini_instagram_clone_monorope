import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeedRequest } from './feed.api';

export const feedKeys = {
  all: ['feed'] as const,
};

export function useFeed() {
  return useInfiniteQuery({
    queryKey: feedKeys.all,
    queryFn: ({ pageParam }) => getFeedRequest(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
