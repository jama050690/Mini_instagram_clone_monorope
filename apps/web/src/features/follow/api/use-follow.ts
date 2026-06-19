import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { profileKeys, type Relationship } from '@/features/profile';
import {
  acceptRequestRequest,
  followRequest,
  getRequestsRequest,
  getSuggestedRequest,
  rejectRequestRequest,
  unfollowRequest,
} from './follow.api';

export const followKeys = {
  requests: ['follow', 'requests'] as const,
  suggested: ['users', 'suggested'] as const,
};

export function useSuggested() {
  return useQuery({
    queryKey: followKeys.suggested,
    queryFn: getSuggestedRequest,
  });
}

/**
 * Follow tugmasi: 'none' → follow, aks holda (following/requested) → unfollow.
 * Muvaffaqiyatdan keyin profil (relationship + counts) qayta yuklanadi.
 */
export function useToggleFollow(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (relationship: Relationship) =>
      relationship === 'none'
        ? followRequest(username)
        : unfollowRequest(username),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profileKeys.detail(username),
      });
      void queryClient.invalidateQueries({
        queryKey: profileKeys.followers(username),
      });
      // Tavsiyalar ro'yxatidan follow qilingan user chiqib ketadi.
      void queryClient.invalidateQueries({ queryKey: followKeys.suggested });
    },
  });
}

export function useFollowRequests() {
  return useInfiniteQuery({
    queryKey: followKeys.requests,
    queryFn: ({ pageParam }) => getRequestsRequest(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => acceptRequestRequest(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: followKeys.requests });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => rejectRequestRequest(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: followKeys.requests });
    },
  });
}
