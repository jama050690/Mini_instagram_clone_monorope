import { apiClient } from '@/shared/api';
import type { Post } from '@/entities/post';

export interface HashtagPage {
  items: Post[];
  nextCursor: string | null;
  tag: string;
  postCount: number;
}

export async function fetchHashtagPosts(
  tag: string,
  cursor?: string,
  limit = 12,
): Promise<HashtagPage> {
  const params: Record<string, string> = { limit: String(limit) };
  if (cursor) params.cursor = cursor;
  const { data } = await apiClient.get(`/hashtags/${encodeURIComponent(tag)}/posts`, { params });
  return data.data as HashtagPage;
}
