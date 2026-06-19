import type { Post } from '@/entities/post';
import { apiClient } from '@/shared/api';
import type { ApiSuccess, Page } from '@/shared/api';
import type { AdminStats, AdminUser } from '../model/types';

export async function getStatsRequest(): Promise<AdminStats> {
  const res = await apiClient.get<ApiSuccess<AdminStats>>('/admin/stats');
  return res.data.data;
}

export async function getUsersRequest(
  search: string,
  cursor?: string,
): Promise<Page<AdminUser>> {
  const res = await apiClient.get<ApiSuccess<Page<AdminUser>>>('/admin/users', {
    params: { search: search || undefined, cursor, limit: 20 },
  });
  return res.data.data;
}

export async function blockUserRequest(id: string): Promise<AdminUser> {
  const res = await apiClient.patch<ApiSuccess<AdminUser>>(
    `/admin/users/${id}/block`,
  );
  return res.data.data;
}

export async function unblockUserRequest(id: string): Promise<AdminUser> {
  const res = await apiClient.patch<ApiSuccess<AdminUser>>(
    `/admin/users/${id}/unblock`,
  );
  return res.data.data;
}

export async function getPostsRequest(cursor?: string): Promise<Page<Post>> {
  const res = await apiClient.get<ApiSuccess<Page<Post>>>('/admin/posts', {
    params: { cursor, limit: 12 },
  });
  return res.data.data;
}

export async function deletePostRequest(id: string): Promise<void> {
  await apiClient.delete(`/admin/posts/${id}`);
}
