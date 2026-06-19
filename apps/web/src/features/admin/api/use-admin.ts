import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  blockUserRequest,
  deletePostRequest,
  getPostsRequest,
  getStatsRequest,
  getUsersRequest,
  unblockUserRequest,
} from './admin.api';

export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  users: (search: string) => ['admin', 'users', search] as const,
  posts: ['admin', 'posts'] as const,
};

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: getStatsRequest });
}

export function useAdminUsers(search: string) {
  return useInfiniteQuery({
    queryKey: adminKeys.users(search),
    queryFn: ({ pageParam }) => getUsersRequest(search, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

function useUserStatusMutation(action: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useBlockUser() {
  return useUserStatusMutation(blockUserRequest);
}

export function useUnblockUser() {
  return useUserStatusMutation(unblockUserRequest);
}

export function useAdminPosts() {
  return useInfiniteQuery({
    queryKey: adminKeys.posts,
    queryFn: ({ pageParam }) => getPostsRequest(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useAdminDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePostRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.posts });
      void queryClient.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}
