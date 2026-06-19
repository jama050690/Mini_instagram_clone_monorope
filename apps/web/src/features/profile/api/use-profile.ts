import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { User } from '@/entities/user';
import { useAuthStore } from '@/features/auth';
import {
  deleteAvatarRequest,
  getFollowersRequest,
  getFollowingRequest,
  getProfileRequest,
  searchUsersRequest,
  setPrivacyRequest,
  updateProfileRequest,
  uploadAvatarRequest,
  type UpdateProfileInput,
} from './profile.api';

export const profileKeys = {
  all: ['profile'] as const,
  detail: (username: string) => ['profile', username] as const,
  search: (q: string) => ['users', 'search', q] as const,
  followers: (username: string) => ['follows', 'followers', username] as const,
  following: (username: string) => ['follows', 'following', username] as const,
};

export function useProfile(username: string) {
  return useQuery({
    queryKey: profileKeys.detail(username),
    queryFn: () => getProfileRequest(username),
    enabled: username.length > 0,
  });
}

export function useSearchUsers(q: string) {
  return useInfiniteQuery({
    queryKey: profileKeys.search(q),
    queryFn: ({ pageParam }) => searchUsersRequest(q, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: q.trim().length > 0,
  });
}

export function useFollowers(username: string) {
  return useInfiniteQuery({
    queryKey: profileKeys.followers(username),
    queryFn: ({ pageParam }) => getFollowersRequest(username, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: username.length > 0,
  });
}

export function useFollowing(username: string) {
  return useInfiniteQuery({
    queryKey: profileKeys.following(username),
    queryFn: ({ pageParam }) => getFollowingRequest(username, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: username.length > 0,
  });
}

/** O'z profiliga ta'sir qiluvchi mutatsiyalardan keyin store + cache yangilanadi. */
function useOwnProfileSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return (user: User) => {
    setUser(user);
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });
  };
}

export function useUpdateProfile() {
  const sync = useOwnProfileSync();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfileRequest(input),
    onSuccess: sync,
  });
}

export function useSetPrivacy() {
  const sync = useOwnProfileSync();
  return useMutation({
    mutationFn: (isPrivate: boolean) => setPrivacyRequest(isPrivate),
    onSuccess: sync,
  });
}

export function useUploadAvatar() {
  const sync = useOwnProfileSync();
  return useMutation({
    mutationFn: (file: File) => uploadAvatarRequest(file),
    onSuccess: sync,
  });
}

export function useDeleteAvatar() {
  const sync = useOwnProfileSync();
  return useMutation({
    mutationFn: deleteAvatarRequest,
    onSuccess: sync,
  });
}
