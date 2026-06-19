import type { UserCard } from '@/entities/user';
import { apiClient } from '@/shared/api';
import type { ApiSuccess, Page } from '@/shared/api';
import type { Relationship } from '@/features/profile';

export interface FollowState {
  relationship: Relationship;
}

export async function followRequest(username: string): Promise<FollowState> {
  const res = await apiClient.post<ApiSuccess<FollowState>>(
    `/users/${username}/follow`,
  );
  return res.data.data;
}

export async function unfollowRequest(username: string): Promise<FollowState> {
  const res = await apiClient.delete<ApiSuccess<FollowState>>(
    `/users/${username}/follow`,
  );
  return res.data.data;
}

export async function getSuggestedRequest(): Promise<UserCard[]> {
  const res = await apiClient.get<ApiSuccess<UserCard[]>>('/users/suggested', {
    params: { limit: 10 },
  });
  return res.data.data;
}

export async function getRequestsRequest(
  cursor?: string,
): Promise<Page<UserCard>> {
  const res = await apiClient.get<ApiSuccess<Page<UserCard>>>(
    '/follow/requests',
    { params: { cursor, limit: 20 } },
  );
  return res.data.data;
}

export async function acceptRequestRequest(userId: string): Promise<void> {
  await apiClient.post(`/follow/requests/${userId}/accept`);
}

export async function rejectRequestRequest(userId: string): Promise<void> {
  await apiClient.post(`/follow/requests/${userId}/reject`);
}
