import type { Post } from '@/entities/post';
import { apiClient } from '@/shared/api';
import type { ApiSuccess, Page } from '@/shared/api';

export async function createPostRequest(
  files: File[],
  caption?: string,
): Promise<Post> {
  const form = new FormData();
  if (caption) form.append('caption', caption);
  for (const file of files) form.append('files', file);
  const res = await apiClient.post<ApiSuccess<Post>>('/posts', form);
  return res.data.data;
}

export async function getPostRequest(id: string): Promise<Post> {
  const res = await apiClient.get<ApiSuccess<Post>>(`/posts/${id}`);
  return res.data.data;
}

export async function getUserPostsRequest(
  username: string,
  cursor?: string,
): Promise<Page<Post>> {
  const res = await apiClient.get<ApiSuccess<Page<Post>>>(
    `/users/${username}/posts`,
    { params: { cursor, limit: 12 } },
  );
  return res.data.data;
}

export async function updateCaptionRequest(
  id: string,
  caption: string,
): Promise<Post> {
  const res = await apiClient.patch<ApiSuccess<Post>>(`/posts/${id}`, {
    caption,
  });
  return res.data.data;
}

export async function deletePostRequest(id: string): Promise<void> {
  await apiClient.delete(`/posts/${id}`);
}
