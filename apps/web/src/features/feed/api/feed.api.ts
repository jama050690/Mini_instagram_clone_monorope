import type { Post } from '@/entities/post';
import { apiClient } from '@/shared/api';
import type { ApiSuccess, Page } from '@/shared/api';

/** Feed sahifasi — bo'sh bo'lsa fallback (public postlar). */
export interface FeedPage extends Page<Post> {
  isFallback: boolean;
}

export async function getFeedRequest(cursor?: string): Promise<FeedPage> {
  const res = await apiClient.get<ApiSuccess<FeedPage>>('/feed', {
    params: { cursor, limit: 10 },
  });
  return res.data.data;
}
