import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './notifications.api';

export const UNREAD_COUNT_KEY = ['notifications', 'unread-count'];

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
  });
}

export function useNotificationsList() {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.setQueryData(UNREAD_COUNT_KEY, 0);
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}
