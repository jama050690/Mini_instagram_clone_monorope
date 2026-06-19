# Current Tasks

> Oxirgi yangilanish: 2026-06-18

## Active Task: Texnik qarz — Visibility konsolidatsiyasi ✅ TUGADI

### Goal
Maxfiylik/user-visibility mantig'i 4 modulda (Users/Posts/Media/Follow)
takrorlangan edi → yagona `VisibilityService`ga jamlandi. Behavior o'zgarmaydi.

### O'zgarishlar
- [x] `modules/visibility/VisibilityService` (@Global, PrismaModule kabi):
  `hiddenFromViewer`, `resolveVisibleUser` (404), `isAcceptedFollower`,
  `assertCanViewContent` (403), `relationship`
- [x] UsersService: `findVisibleUser`/`relationshipBetween` → delegatsiya
- [x] PostsService: `assertCanView` o'chirildi → `assertCanViewContent`; `listByAuthor` inline → `resolveVisibleUser`
- [x] MediaService.resolveForViewer: private/follow blok → `assertCanViewContent`
- [x] FollowService.resolveTarget → `resolveVisibleUser`
- [x] Feed/Engagement allaqachon reuse qilardi (Feed query-level filtr, Engagement → PostsService)

### Verification (2026-06-18)
- api: build ✓ | unit 58/58 ✓ (+15 visibility) | e2e 131/131 ✓ (o'zgarmadi = behavior bir xil) | lint 0 err

---

## Done: M4.8 — Admin (backend + frontend) ✅ TUGADI

### Goal
Admin uchun statistika, foydalanuvchi bloklash, kontent moderatsiyasi.
RolesGuard bilan himoya. FE: admin panel.

### Backend (apps/api)
- [x] `RolesGuard` + `@Roles(Role.ADMIN)` decorator (common/) — JwtAuthGuard'dan keyin
- [x] `GET /admin/stats` (users/blocked/posts/comments/new7d/private-public)
- [x] `GET /admin/users` (search, bloklangan ham), `GET /admin/users/:id` (counts)
- [x] `PATCH /admin/users/:id/block|unblock` — admin o'zini bloklay olmaydi → 400; mavjud emas → 404
- [x] `GET /admin/posts` (moderatsiya), `DELETE /admin/posts/:id` & `/admin/comments/:id` — PostsService.remove / EngagementService.deleteComment reuse (admin)
- [x] block → bloklangan user 403 (JwtStrategy) + profil/search/feed'dan yashirin (mavjud mantiq)

### Frontend (apps/web) — FSD
- [x] `features/admin`: api + hooks (useAdminStats/useAdminUsers/useBlock/useUnblock/useAdminPosts/useAdminDeletePost) + tiplar
- [x] `AdminStats` (kartalar), `AdminUsers` (qidiruv + block/unblock), `AdminPosts` (grid + delete)
- [x] `pages/admin` (/admin, tab: users/posts); `RequireAdmin` guard; nav "Admin" faqat ADMIN'da

### Verification (2026-06-18)
- api: build ✓ | unit 43/43 ✓ (RolesGuard 4, admin 1) | e2e 131/131 ✓ (admin 10) | lint 0 err
- web: `npm run build` ✓ | lint 0 err (1 benign button warning)

### Eslatma / deferred
- ModerationLog (kim nimani o'chirgani) — MVP'da yo'q (SRS).
- Block'da refresh token revoke qilinmaydi — JwtStrategy har so'rovda isBlocked tekshiradi (≤15m ichida bloklanadi). MVP uchun yetarli.
- **Barcha MVP modullari tugadi.** Qolgan: maxfiylik konsolidatsiyasi (texnik qarz) + Deploy (docker-compose, .env.example, README).

---

## Done: M4.7 — Feed (backend + frontend) ✅ TUGADI

### Goal
Xronologik lenta (obuna + o'zi), bo'sh bo'lsa fallback public postlar + tavsiya
etilgan profillar. FE: bosh sahifa feed.

### Backend (apps/api)
- [x] `FeedModule`: `GET /feed?cursor=&limit=` — ACCEPTED follow + o'zi, createdAt DESC,id DESC; bloklangan author yo'q
- [x] Bo'sh feed → so'nggi public postlar (`FeedPage.isFallback=true`), existence-check (findFirst) bilan barqaror pagination
- [x] `GET /users/suggested?limit=` — UsersService.suggested (public, non-followed, self/private/admin/blocked yo'q); UsersController'da `:username`dan oldin (route collision yo'q)
- [x] FeedService post serializer'ni qayta ishlatadi (postIncludeFor/toPostView)

### Frontend (apps/web) — FSD
- [x] `features/feed`: api + useFeed (infinite) + `FeedList` (PostCard + LikeBar + izoh link)
- [x] `features/follow`: useSuggested + `SuggestedUsers` (FollowButton bilan)
- [x] `HomePage`: feed; isFallback bo'lsa SuggestedUsers + izoh banner
- [x] `useToggleLike` infinite ro'yxatlarni (feed + posts-by-user) setQueriesData bilan sync qiladi — like darhol aks etadi

### Verification (2026-06-18)
- api: build ✓ | unit 38/38 ✓ (feed 2) | e2e 121/121 ✓ (feed 5) | lint 0 err
- web: `npm run build` ✓ | lint 0 err (1 benign button warning)

### Eslatma / deferred
- Suggested tartibi: eng yangi (createdAt). "Eng ko'p followerli" — keyin.
- Maxfiylik/target-resolve mantig'i 6 nuqtada takrorlanadi — M4.8 dan keyin `common/`ga konsolidatsiya kuchli tavsiya.

---

## Done: M4.6 — Follow (backend + frontend) ✅ TUGADI

### Goal
Follow/unfollow, private akkauntlar uchun so'rov (request) tizimi: accept/reject.
FE: profil follow tugmasi + so'rovlar sahifasi.

### Backend (apps/api)
- [x] `FollowModule`: follow/unfollow/listRequests/accept/reject (PrismaService lokal target resolve)
- [x] `POST /users/:username/follow` — public→ACCEPTED, private→PENDING, idempotent, self→400 SELF_FOLLOW, relationship qaytaradi
- [x] `DELETE /users/:username/follow` — unfollow / pending bekor (idempotent)
- [x] `GET /follow/requests` (cursor, UserCard), `POST /follow/requests/:userId/accept|reject` (204, target egasi)
- [x] Counts faqat ACCEPTED; private→public auto-accept M2 `setPrivacy`da (atomik) — follow e2e bilan tasdiqlandi
- [x] ErrorCode: SELF_FOLLOW

### Frontend (apps/web) — FSD
- [x] `features/follow`: api + hooks (useToggleFollow profil invalidate, useFollowRequests infinite, useAccept/useReject) + tiplar
- [x] `FollowButton` (none→follow / following|requested→unfollow), `FollowRequests` (accept/reject qatorlar)
- [x] `ProfileHeader` followButton **slot** prop (profil page uzatadi → profile⇄follow sikli yo'q)
- [x] `pages/requests` (/requests); router + nav "So'rovlar"

### Verification (2026-06-18)
- api: build ✓ | unit 36/36 ✓ (follow 6) | e2e 116/116 ✓ (follow 12) | lint 0 err
- web: `npm run build` ✓ | lint 0 err (1 benign button warning)

### Eslatma / deferred
- Remove follower (obunachini chetlatish) — MVP'da yo'q (SRS).
- Maxfiylik resolve target Posts/Engagement/Media/Users bilan takrorlanadi (5 nuqta) — M4.7 dan keyin `common/`ga konsolidatsiya kerak.

---

## Done: M4.5 — Engagement (backend + frontend) ✅ TUGADI

### Goal
Postlarga like (toggle, idempotent) va izoh (flat, CRUD). Maxfiylik: faqat
ko'rinadigan postga. FE: like tugmasi + izoh bo'limi post detail'da.

### Backend (apps/api)
- [x] `EngagementModule` (PostsModule reuse): like/unlike/addComment/listComments/deleteComment
- [x] `POST/DELETE /posts/:id/like` — idempotent (upsert/deleteMany), yangilangan `PostView` (likeCount+likedByMe)
- [x] `POST /posts/:id/comments` (text≤1000), `GET .../comments` (cursor, newest-first)
- [x] `DELETE /comments/:id` — izoh egasi / post egasi / admin (soft delete), 204
- [x] Maxfiylik: `PostsService.assertViewablePost` (private non-follower→403, deleted/blocked→404) mutatsiyadan oldin
- [x] `PostsService.getById`ga `isBlocked` guard (media serving bilan moslik)

### Frontend (apps/web) — FSD
- [x] `features/engagement`: api + hooks (useToggleLike/useComments/useAddComment/useDeleteComment, post cache sync) + tiplar
- [x] `LikeBar` (heart toggle + like/izoh sonlari), `CommentSection` (yozish + infinite ro'yxat), `CommentItem` (ruxsatga ko'ra o'chirish)
- [x] `PostPage`da composition (PostCard + LikeBar + CommentSection); PostCard read-only count'lar olib tashlandi

### Verification (2026-06-18)
- api: build ✓ | unit 31/31 ✓ (engagement 6) | e2e 104/104 ✓ (engagement 13) | lint 0 err
- web: `npm run build` ✓ | lint 0 err (1 benign button warning)

### Eslatma / deferred
- Like/unlike `PostView` qaytaradi (FE bitta call'da sync). Comment newest-first (cursor).
- Follow tugmasi → M4.6. `assertViewablePost` Media/Users bilan maxfiylikning 4-nuqtasi — M4.6 dan keyin konsolidatsiya.

---

## Done: M4 — Post (backend + frontend) ✅ TUGADI

### Goal
caption bilan rasm/karusel/video post yaratish (multipart, tranzaksion), ko'rish,
profil grid, caption tahrirlash, soft delete. FE: yaratish sahifasi, grid, detail.

### Backend (apps/api)
- [x] `PostsModule` (MediaModule reuse): create/getById/listByAuthor/updateCaption/remove
- [x] `POST /posts` (multipart caption?+files[]) — tur auto (1 rasm IMAGE / 2–10 CAROUSEL / 1 video VIDEO), aralash→MIXED_MEDIA, son→INVALID_MEDIA_COUNT
- [x] Tranzaksion: `$transaction` Post+Media + diskka yozish; xato → rollback + `deletePostDir`
- [x] `GET /posts/:id`, `GET /users/:username/posts` (cursor grid) — maxfiylik: deleted/blocked/admin→404, private non-follower→403
- [x] `PATCH /posts/:id` (caption, egasi), `DELETE /posts/:id` (soft + fayl, egasi/admin, 204)
- [x] `PostView`: media url=`/api/v1/media/:id`, like/commentCount + likedByMe (`_count` + viewer like)
- [x] `MediaService.mimeFor(ext)` (magic-byte natijasiga tayanadi, `file.mimetype`ga emas)
- [x] ErrorCode: `INVALID_MEDIA_COUNT`, `MIXED_MEDIA`

### Frontend (apps/web) — FSD
- [x] `entities/post`: tiplar + `AuthedMedia` (blob orqali avtorizatsiyali media, React Query keshi) + `PostThumb`
- [x] `features/post`: api + hooks (usePost/useUserPosts/useCreatePost/useUpdateCaption/useDeletePost) + klient validatsiya + `CreatePostForm`/`PostGrid`/`PostCard`
- [x] `pages`: create (/create), post detail (/p/:id); profil grid placeholder → `PostGrid`
- [x] router `/create` + `/p/:id`; nav "Yangi"; `shared/ui/Textarea`; `features/profile` `profileKeys` export

### Verification (2026-06-18)
- api: build ✓ | unit 25/25 ✓ (posts 3: count/mixed/rollback) | e2e 91/91 ✓ (posts 23) | lint 0 err
- web: `npm run build` (tsc -b + vite) ✓ | lint 0 err (1 benign button warning)

### Eslatma / deferred
- Like/Comment tugmalari (interaktiv) — M4.5 engagement. Hozir PostCard'da faqat sonlar (read-only).
- Follow tugmasi — M4.6. AuthedMedia object URL'lari revoke qilinmaydi (React Query keshi; MVP uchun maqbul).
- Maxfiylik tekshiruvi PostsService'da lokal (Media/Users bilan 3-nusxa) — konsolidatsiya keyinroq.

---

## Done: M3 — Media backend ✅ TUGADI

### Goal
Post media validate/store/delete, avtorizatsiyali serving (`GET /media/:id`,
Range), yetim fayllarni davriy tozalash. Avatar qismi M2'da qilingan edi.

### Subtasks
- [x] MediaService: `detectVideoType` (mp4/webm/mov) + `validatePostMedia` (rasm ≤5MB / video ≤20MB, magic-byte)
- [x] `storePostMedia`/`deletePostDir`/`resolveUploadPath` + no-op `process()` hook
- [x] `resolveForViewer`: media→post→author avtorizatsiya (deleted/blocked → 404, private+non-follower → 403)
- [x] `GET /media/:id` (JWT) stream: Content-Type/Accept-Ranges/Cache-Control + Range → 206 Content-Range; yetim fayl → 404
- [x] `MediaCleanupService`: `@Cron` (har kuni 03:00) `sweepOrphans` — DB'da posti yo'q `uploads/posts/*` papkalarni o'chiradi
- [x] `ScheduleModule.forRoot()` (app.module), MediaModule app.module'ga ulandi

### Verification (2026-06-16)
- build ✓ | unit 22/22 ✓ (media 10: 8 validate + 2 cleanup) | e2e 65/65 ✓ (media serving 8) | lint OK
- Post-visibility tekshiruvi `resolveForViewer`da — M4 (post/feed) shuni qayta ishlatadi

### Eslatma
- Media yozuvlari real `POST /posts` (M4) orqali yaratiladi; M3 testlarida fixture (prisma+fs) ishlatildi.
- Tranzaksion rollback tozalashi (post create fail → fayllarni o'chirish) M4'da `MediaService.deletePostDir` bilan.

---

## Done: FE M2 — Profile UI ✅ TUGADI

### Goal
Backend M2 (Profile) uchun frontend: app navigatsiya layout, profil ko'rish,
sozlamalar (tahrir/privacy/avatar), qidiruv, followers/following ro'yxati.

### Subtasks
- [x] `widgets/app-nav`: autentifikatsiyalangan layout (Home/Search/Profil/Settings nav + avatar + logout); home shu layout'ga ko'chdi
- [x] `entities/user`: UserCard tipi + UserCardRow
- [x] `features/profile`: api (getProfile/search/followers/following/update/privacy/avatar) + hooks (useQuery + useInfiniteQuery + mutatsiyalar, query keys, own-profile sync) + zod schema
- [x] `features/profile` UI: ProfileHeader (counts clickable, relationship/private-aware), ProfileEditForm, PrivacyToggle, AvatarUploader (2MB client check), UserList (load-more)
- [x] `pages`: profile (/u/:username), settings (/settings), search (/search, debounced), follow-list (/u/:username/followers|following, 403 shell)
- [x] `shared/lib/use-debounce`; router auth route'lari AppNav layout ostida

### Verification (2026-06-16)
- tsc --noEmit ✓ | `npm run build` ✓ | `npm run lint` 0 error (1 benign warning) ✓
- API smoke (FE kontrakti): GET /users/:username → ProfileView ✓, PATCH /profile ✓, search → Page<UserCard> ✓, followers → Page ✓

### Eslatma
- Follow tugmasi (follow/unfollow/request) M4.6'da qo'shiladi — hozir profilda faqat ko'rish + self-edit.
- Postlar grid'i M4'da; hozir profilda placeholder/private-shell.

---

## Done: Frontend poydevor + M1 auth ✅ TUGADI

### Goal
Frontend FSD poydevorini qurish (apps/web) va M1 auth UI'sini ulash. Bundan keyin
har modul ham backend ham frontend birga quriladi.

### Subtasks
- [x] Deps: react-router-dom v7, @tanstack/react-query, axios, zustand, react-hook-form, zod, Tailwind v4, shadcn-style UI
- [x] Config: vite alias `@`, proxy `/api`+`/uploads`, tsconfig paths, Tailwind v4 theme (oklch), eslint flat config
- [x] `shared`: api client (refresh interceptor, 401→refresh→retry), auth-token holder, query-client, error helpers, UI (Button/Input/Label/Card/Spinner/AuthShell), cn
- [x] `entities/user`: User tipi + UserAvatar
- [x] `features/auth`: Zustand store (access token memory), api (login/register/logout/me/refresh/googleComplete), hooks, zod schemas, bootstrap, formalar, GoogleButton
- [x] `app`: providers (Query + bootstrap), router, guards (RequireAuth/GuestOnly)
- [x] `pages`: login, register, onboarding/username, auth/callback (Google), home (placeholder)

### Verification (2026-06-16)
- tsc --noEmit ✓ | `npm run build` (tsc -b + vite) ✓ | `npm run lint` 0 error (1 benign react-refresh warning) ✓
- Dev smoke: API (health ok, M2 route'lar map) + web (5173) ko'tarildi; proxy orqali register → 201 + httpOnly refresh cookie (Path=/api/v1/auth) + envelope ✓

### Eslatma
- Avatar serving dev'da `/uploads` proxy orqali (5173→3000).
- FE test (Vitest + Testing Library) hali yo'q — keyingi qadamda qo'shsa bo'ladi; backend behavior testlari mavjud.
- Refresh cookie Path=/api/v1/auth — refresh/logout endpointlarini qamrab oladi (bootstrap ishlaydi).

---

## Done: M2 — Profile ✅ TUGADI

### Goal
Profil ko'rish/tahrir (maxfiylik), foydalanuvchi qidirish, follower/following
ro'yxati, privacy toggle (Private→Public auto-accept), avatar yuklash/o'chirish.

### Subtasks
- [x] `users` modul: `GET /users/:username` (privacy + relationship self/following/requested/none + canViewPosts + counts)
- [x] `GET /users/search?q=&cursor=&limit=` (username/fullName, case-insensitive, bloklangan chiqmaydi, cursor pagination)
- [x] `GET /users/:username/followers` & `/following` (maxfiylik: private+non-follower → 403)
- [x] `profile` modul: `PATCH /profile` (fullName/username/bio, unique → 409)
- [x] `PATCH /profile/privacy` (toggle; Private→Public → PENDING follow'lar `updateMany` ACCEPTED, tranzaksiyada)
- [x] `media` modul (minimal): `MediaService.validateImage` (magic-byte jpg/png/webp + 2MB) + storeAvatar/deleteAvatar
- [x] `POST /profile/avatar` (multipart memoryStorage) + `DELETE /profile/avatar`; avatar `/uploads/avatars/{userId}.{ext}` static
- [x] `common/utils/pagination.ts` (cursor helper), `UPLOAD_DIR` env, error codes (FILE_TOO_LARGE, INVALID_FILE_TYPE)

### Verification (2026-06-16)
- build ✓ | unit 15/15 ✓ (media validate 3 ta yangi) | e2e 57/57 ✓ (users 19 + profile 15 yangi) | eslint exit 0 ✓
- ESLint: test fayllar uchun scoped override qo'shildi (supertest `res.body` = `any` → unsafe-* qoidalari testlarda o'chirildi; eski auth e2e ham endi toza)

### Eslatma / deferred
- Avatar M3 Media pipeline'ining bir qismi sifatida hozir qilindi (foydalanuvchi qarori: "to'liq M2").
- M3'da qoladi: post media (multipart, tranzaksion), avtorizatsiyali `GET /media/:id` stream (Range), yetim fayl cleanup cron, `process()` siqish hook.
- Full FollowService M4.6'da; M2'da Follow jadvaliga to'g'ridan-to'g'ri so'rov (behavior test bilan qoplangan).

---

## Done: M1 — Auth ✅ TUGADI

### Goal
Email/parol + Google OAuth autentifikatsiya, JWT (access+refresh), rotatsiyalanadigan
refresh token, onboarding.

### Subtasks
- [x] Auth deps (bcrypt, @nestjs/jwt, passport-jwt/local, google-oauth20, cookie-parser) + env JWT
- [x] TDD test harness: alohida test DB (instagram_mvp_test), e2e helper, configureApp shared setup
- [x] Register (uniqueness 409, bcrypt, validatsiya)
- [x] Login (INVALID_CREDENTIALS, USER_BLOCKED, OAuth-only)
- [x] JwtStrategy + JwtAuthGuard + @CurrentUser + GET /auth/me (blocked → 403)
- [x] Refresh rotatsiya + logout + reuse-detection (barcha sessiyalarni bekor qilish)
- [x] Google: signIn (link/onboarding qarori) + /auth/google/complete + redirect endpointlar (conditional strategy)

### Verification (2026-06-13)
- build ✓ | unit 12/12 ✓ | e2e 23/23 ✓ | eslint toza ✓
- Dev smoke: register → 201 + httpOnly refresh cookie; /auth/me Bearer ✓; tokensiz 401 ✓
- Google creds yo'q — app baribir ko'tariladi (strategy conditional)

### Eslatma
- Google redirect endpointlari (`/auth/google`, callback) e2e'da test qilinmadi (real OAuth kerak);
  biznes logika (signIn, onboarding) to'liq test qilingan.

---

## Done: M0 — Core/Infra ✅

### Goal
Monorepo skeletini qurish va backend infratuzilmasini tayyorlash.

### Subtasks
- [x] Hozirgi root `src/` ni `apps/api/` ga ko'chirish, npm workspaces sozlash
- [x] Prisma o'rnatish + to'liq schema (Technical_SRS §8) + PrismaService (global)
- [x] docker-compose (postgres) + `apps/api/.env.example`
- [x] `@nestjs/config` + env sxema validatsiyasi (zod) + testlar
- [x] Global `ValidationPipe`, `AllExceptionsFilter`, `ResponseInterceptor` + testlar
- [x] Swagger setup (`/api/docs`), `/api/v1` prefiks
- [x] `GET /health` (DB ping bilan)
- [x] `apps/web` Vite skeleton (keyinroq to'ldiriladi)

### Verification (2026-06-13)
- `npm run build` ✓ | `npm test` → 12/12 ✓
- Lokal Postgres@15 + `prisma migrate dev --name init` ✓
- `/api/v1/health` → `{success:true,data:{status:ok,db:up}}` ✓ | `/api/docs` → 200 ✓ | prefiks ✓

### Blockers
- Yo'q. Docker bu muhitda yo'q — lokal Postgres@15 (5432) ishlatildi.

---

## Upcoming Tasks (Priority Order)
1. M4 — Post (keyingi, BE + FE birga): create (multipart, tranzaksion — MediaService bilan), grid, edit caption, delete
2. M4.5 — Engagement
3. M4.6 — Follow (FE'da follow tugmasi/requests shu yerda)
4. M4.7 — Feed
5. M4.8 — Admin

## Session Log
### 2026-06-16 (M3 media backend)
- M3: post media validate (image/video magic-byte), store/delete, avtorizatsiyali GET /media/:id (Range/206), orphan cleanup cron.
- unit 22/22, e2e 65/65, build/lint ✓.

### 2026-06-16 (FE M2 profile)
- FE M2: app-nav layout, profil ko'rish (/u/:username), settings (edit/privacy/avatar), qidiruv (/search), followers/following ro'yxat.
- build/typecheck/lint ✓; API smoke (profil/search/followers FE kontrakti) ✓.

### 2026-06-16 (frontend)
- Frontend poydevor qurildi: FSD (app/pages/features/entities/shared) + Tailwind v4 + shadcn-style UI + TanStack Query + Router v7 + axios refresh interceptor + Zustand.
- M1 auth UI: login/register/onboarding/Google callback/logout + guards + bootstrap refresh.
- build/typecheck/lint ✓; dev smoke (proxy register → 201 + cookie) ✓.

### 2026-06-16 (M2 backend)
- M2 (Profile) TDD bilan to'liq qurildi: users (view/search/followers/following) + profile (edit/privacy/avatar) + minimal media (avatar validate/store/delete).
- 34 yangi test (3 unit + 19 users e2e + 12 profile e2e... jami e2e 57/57, unit 15/15), eslint exit 0.
- ESLint test override qo'shildi; `.env.example`/`.gitignore` yangilandi.

### 2026-06-13
- Ikkala system prompt (`FRONTEND-CLAUDE-PROMPT.md`, `CLAUDE_PROJECT_PROMPT_v2_EN.md`) o'rganildi.
- Loyihaga mos qoidalar root `CLAUDE.md` ga sintez qilindi.
- M0 (infra) qurildi va tasdiqlandi → commit/push.
- M1 (Auth) TDD bilan to'liq qurildi: register/login/refresh/logout/me + Google onboarding.
  35 test (12 unit + 23 e2e) yashil, eslint toza.
