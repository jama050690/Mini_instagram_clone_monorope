import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminPage } from '@/pages/admin';
import { AuthCallbackPage } from '@/pages/auth-callback';
import { CreatePostPage } from '@/pages/create-post';
import { FollowListPage } from '@/pages/follow-list';
import { HashtagPage } from '@/pages/hashtag';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { OnboardingPage } from '@/pages/onboarding';
import { PostPage } from '@/pages/post';
import { ProfilePage } from '@/pages/profile';
import { RegisterPage } from '@/pages/register';
import { NotificationsPage } from '@/pages/notifications';
import { RequestsPage } from '@/pages/requests';
import { SearchPage } from '@/pages/search';
import { SettingsPage } from '@/pages/settings';
import { AppNav } from '@/widgets/app-nav';
import { GuestOnly } from './guards/guest-only';
import { RequireAdmin } from './guards/require-admin';
import { RequireAuth } from './guards/require-auth';

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  { path: '/onboarding/username', element: <OnboardingPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppNav />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/create', element: <CreatePostPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/requests', element: <RequestsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/p/:id', element: <PostPage /> },
          { path: '/u/:username', element: <ProfilePage /> },
          { path: '/u/:username/followers', element: <FollowListPage type="followers" /> },
          { path: '/u/:username/following', element: <FollowListPage type="following" /> },
          { path: '/hashtags/:tag', element: <HashtagPage /> },
          {
            element: <RequireAdmin />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
