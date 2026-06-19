import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import type { Post } from '@/entities/post';
import { postKeys } from '@/features/post';
import type { Page } from '@/shared/api';
import {
  addCommentRequest,
  deleteCommentRequest,
  getCommentsRequest,
  likeRequest,
  unlikeRequest,
} from './engagement.api';

export const commentKeys = {
  list: (postId: string) => ['comments', postId] as const,
};

/**
 * Feed va grid kabi infinite ro'yxatlardagi post nusxasini yangilaydi — like
 * bosilganda ro'yxat ham darhol aks ettiradi (alohida `postKeys.detail`'dan
 * tashqari). Faqat infinite list query'larni (feed / posts-by-user) tegadi.
 */
function patchPostInLists(queryClient: QueryClient, updated: Post): void {
  queryClient.setQueriesData<InfiniteData<Page<Post>>>(
    {
      predicate: (q) =>
        q.queryKey[0] === 'feed' ||
        (q.queryKey[0] === 'posts' && q.queryKey[1] === 'user'),
    },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((p) => (p.id === updated.id ? updated : p)),
            })),
          }
        : old,
  );
}

/** Like'ni joriy holatga qarab qo'shadi/oladi; yangilangan postni keshga yozadi. */
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: Post) =>
      post.likedByMe ? unlikeRequest(post.id) : likeRequest(post.id),
    onSuccess: (updated) => {
      queryClient.setQueryData(postKeys.detail(updated.id), updated);
      patchPostInLists(queryClient, updated);
    },
  });
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: commentKeys.list(postId),
    queryFn: ({ pageParam }) => getCommentsRequest(postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: postId.length > 0,
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => addCommentRequest(postId, text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
      // commentCount yangilanishi uchun.
      void queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteCommentRequest(commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
      void queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}
