import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { profileKeys } from '@/features/profile';
import {
  createPostRequest,
  deletePostRequest,
  getPostRequest,
  getUserPostsRequest,
  updateCaptionRequest,
} from './post.api';

export const postKeys = {
  all: ['posts'] as const,
  detail: (id: string) => ['posts', id] as const,
  byUser: (username: string) => ['posts', 'user', username] as const,
};

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => getPostRequest(id),
    enabled: id.length > 0,
  });
}

export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: postKeys.byUser(username),
    queryFn: ({ pageParam }) => getUserPostsRequest(username, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: username.length > 0,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ files, caption }: { files: File[]; caption?: string }) =>
      createPostRequest(files, caption),
    onSuccess: (post) => {
      void queryClient.invalidateQueries({
        queryKey: postKeys.byUser(post.author.username),
      });
      // Profil post soni o'zgardi.
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateCaption(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caption: string) => updateCaptionRequest(id, caption),
    onSuccess: (post) => {
      queryClient.setQueryData(postKeys.detail(id), post);
      void queryClient.invalidateQueries({
        queryKey: postKeys.byUser(post.author.username),
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePostRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postKeys.all });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
