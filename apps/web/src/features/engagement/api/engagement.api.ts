import type { Post } from '@/entities/post';
import { apiClient } from '@/shared/api';
import type { ApiSuccess, Page } from '@/shared/api';
import type { Comment } from '../model/types';

export async function likeRequest(postId: string): Promise<Post> {
  const res = await apiClient.post<ApiSuccess<Post>>(`/posts/${postId}/like`);
  return res.data.data;
}

export async function unlikeRequest(postId: string): Promise<Post> {
  const res = await apiClient.delete<ApiSuccess<Post>>(`/posts/${postId}/like`);
  return res.data.data;
}

export async function addCommentRequest(
  postId: string,
  text: string,
): Promise<Comment> {
  const res = await apiClient.post<ApiSuccess<Comment>>(
    `/posts/${postId}/comments`,
    { text },
  );
  return res.data.data;
}

export async function getCommentsRequest(
  postId: string,
  cursor?: string,
): Promise<Page<Comment>> {
  const res = await apiClient.get<ApiSuccess<Page<Comment>>>(
    `/posts/${postId}/comments`,
    { params: { cursor, limit: 20 } },
  );
  return res.data.data;
}

export async function deleteCommentRequest(commentId: string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
