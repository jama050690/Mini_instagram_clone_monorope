import type { User, UserCard } from '@/entities/user';
import { apiClient } from '@/shared/api';
import type { ApiSuccess, Page } from '@/shared/api';
import type { ProfileView } from '../model/types';

export interface UpdateProfileInput {
  fullName?: string;
  username?: string;
  bio?: string;
}

export async function getProfileRequest(username: string): Promise<ProfileView> {
  const res = await apiClient.get<ApiSuccess<ProfileView>>(`/users/${username}`);
  return res.data.data;
}

export async function searchUsersRequest(
  q: string,
  cursor?: string,
): Promise<Page<UserCard>> {
  const res = await apiClient.get<ApiSuccess<Page<UserCard>>>('/users/search', {
    params: { q, cursor, limit: 20 },
  });
  return res.data.data;
}

export async function getFollowersRequest(
  username: string,
  cursor?: string,
): Promise<Page<UserCard>> {
  const res = await apiClient.get<ApiSuccess<Page<UserCard>>>(
    `/users/${username}/followers`,
    { params: { cursor, limit: 20 } },
  );
  return res.data.data;
}

export async function getFollowingRequest(
  username: string,
  cursor?: string,
): Promise<Page<UserCard>> {
  const res = await apiClient.get<ApiSuccess<Page<UserCard>>>(
    `/users/${username}/following`,
    { params: { cursor, limit: 20 } },
  );
  return res.data.data;
}

export async function updateProfileRequest(input: UpdateProfileInput): Promise<User> {
  const res = await apiClient.patch<ApiSuccess<User>>('/profile', input);
  return res.data.data;
}

export async function setPrivacyRequest(isPrivate: boolean): Promise<User> {
  const res = await apiClient.patch<ApiSuccess<User>>('/profile/privacy', { isPrivate });
  return res.data.data;
}

export async function uploadAvatarRequest(file: File): Promise<User> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await apiClient.post<ApiSuccess<User>>('/profile/avatar', form);
  return res.data.data;
}

export async function deleteAvatarRequest(): Promise<User> {
  const res = await apiClient.delete<ApiSuccess<User>>('/profile/avatar');
  return res.data.data;
}
