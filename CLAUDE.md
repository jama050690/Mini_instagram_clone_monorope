# Kichik Instagram (MVP) — Claude Context

> Oxirgi yangilanish: 2026-06-13
> Asos hujjatlar: `docs/Instagram_MVP_SRS.md` (biznes), `docs/Technical_SRS.md` (texnik)

## Rol

Sen bu loyihada **Senior Software Engineer + Software Architect**san (backend) va
**Senior Frontend Engineer + UI/UX-aware Architect**san (frontend). Mas'uliyat:
toza/production-ready kod, scalable arxitektura, TDD, OWASP Top 10, Swagger, doimiy
yangilanadigan hujjat.

**Til:** foydalanuvchi bilan **o'zbekcha**, texnik atamalar inglizcha.

## Quick Start

- **Backend:** NestJS 11 + TypeScript + Prisma + PostgreSQL (`apps/api`)
- **Frontend:** React + Vite + TS + Tailwind + shadcn/ui + TanStack Query (`apps/web`)
- **Monorepo:** npm workspaces (`apps/*`)
- Run (api): `npm run start:dev -w apps/api`
- Run (web): `npm run dev -w apps/web`

## Arxitektura

### Backend (`apps/api`)
- Modul tuzilishi: `modules/` (auth, users, profile, media, posts, engagement,
  follows, feed, admin) + `common/` (guards, filters, interceptors, decorators) +
  `prisma/` + `config/`.
- API prefiks: `/api/v1`. Envelope: `{ success, data }` / `{ success, error:{code,message,details} }`.
- Auth: JWT access (15m) + refresh (30d, DB'da xeshlangan, rotatsiya), httpOnly cookie.
- Pagination: cursor-based (`?cursor=&limit=`, javobda `nextCursor`).
- Global: `ValidationPipe({whitelist,transform})`, `AllExceptionsFilter`, response interceptor.

### Frontend (`apps/web`) — FSD v2
- Qatlamlar (faqat pastga import): `app → pages → widgets → features → entities → shared`.
- Cross-slice faqat `index.ts` public API orqali.
- `features/` ichida: `ui/`, `model/`, `api/`, `lib/`, `config/` (faqat kerakli segmentlar).
- Token: access — memory/state; refresh — httpOnly cookie (FE ko'rmaydi).
- axios interceptor: access token qo'shadi, 401'da refresh.

## Workflow (o'zgarish hajmiga qarab)

| Hajm | Tavsif | Amal |
|---|---|---|
| **Small** | ≤20 satr, bitta fayl | To'g'ridan-to'g'ri |
| **Medium** | Bir nechta fayl, yangi endpoint/slice | Qisqa reja → implement |
| **Large** | Arxitektura o'zgarishi, yangi modul/qatlam | Tasdiq kutish → implement |

- **Module-by-module:** har bosqich (M0→M1→...) tasdiqlanib boriladi.
- Kod yozishdan oldin: `CLAUDE.md` → `CURRENT_TASK.md` → modul/slice hujjati o'qiladi.
- Har service uchun `.service.spec.ts`, controller uchun integratsiya testi (`tdd` skill).
- Kod yozgandan keyin: `CURRENT_TASK.md` yangilanadi, blocker darhol xabar qilinadi.

## Build plan (Technical_SRS §7)

1. **M0** — Core/Infra: monorepo, Prisma+Postgres (docker), config/env validatsiya, global filter/pipe/interceptor, Swagger, health.
2. **M1** — Auth: User+RefreshToken, register/login/refresh/logout, JWT guards, `@CurrentUser`, Google OAuth + onboarding.
3. **M2** — Profile: ko'rish/tahrir, privacy toggle, avatar, qidiruv.
4. **M3** — Media: validate/store/process-hook, `GET /media/:id`, cleanup cron.
5. **M4** — Post: create (multipart, tranzaksion), grid, edit caption, delete.
6. **M4.5** — Engagement: like toggle, comment CRUD.
7. **M4.6** — Follow: follow/unfollow, requests, accept/reject, private→public auto-accept.
8. **M4.7** — Feed: xronologik + fallback + suggested.
9. **M4.8** — Admin: seed, stats, block, moderation.
10. **Frontend** — modul bilan parallel/ketma-ket (kelishiladi).
11. **Deploy** — docker-compose, .env.example, README.

## Modul holati

| Modul | Holat | Izoh |
|---|---|---|
| M0 infra | DONE | monorepo, Prisma, env, filter/pipe/interceptor, Swagger, health ✓ |
| M1 auth | DONE | register/login/refresh(rotation+reuse)/logout, JWT guard, @CurrentUser, Google OAuth+onboarding ✓ |
| M2 profile | DONE | profil ko'rish (privacy+relationship), search, followers/following, edit, privacy toggle (auto-accept), avatar upload/delete (magic-byte) ✓ |
| M3 media | DONE | avatar + post media validate(magic-byte image/video)/store/delete, avtorizatsiyali `GET /media/:id` stream (Range/206), orphan cleanup cron (@nestjs/schedule) ✓ |
| M4 post | DONE | create (multipart, tranzaksion + rollback), grid, get, edit caption, soft delete (egasi/admin); tur auto IMAGE/CAROUSEL/VIDEO; maxfiylik 404/403; PostView (_count like/comment + likedByMe) ✓ |
| M4.5 engagement | DONE | like toggle (idempotent, PostView qaytaradi), comment CRUD (text≤1000, newest-first cursor), delete egasi/post egasi/admin; maxfiylik assertViewablePost reuse ✓ |
| M4.6 follow | DONE | follow/unfollow (public→accepted/private→pending, idempotent, self→400), request listrequests/accept/reject, counts faqat ACCEPTED, private→public auto-accept ✓ |
| M4.7 feed | DONE | GET /feed (ACCEPTED follow + o'zi, createdAt/id cursor), bo'sh→fallback public postlar (isFallback), GET /users/suggested (public, non-followed) ✓ |
| M4.8 admin | DONE | RolesGuard+@Roles, /admin/stats, users list/get/block/unblock (self-block 400), posts moderatsiya, post/comment delete (reuse); block→403+yashirin ✓ |
| FE poydevor | DONE | FSD + Tailwind v4 + shadcn-style UI + TanStack Query + Router v7 + axios(refresh interceptor) + Zustand auth ✓ |
| FE M1 auth | DONE | login/register/onboarding/Google callback/logout + guards (RequireAuth/GuestOnly) + bootstrap refresh ✓ |
| FE M2 profile | DONE | app nav layout, profil ko'rish (/u/:username), settings (edit/privacy/avatar), qidiruv (/search), followers/following ro'yxat ✓ |
| FE M4 post | DONE | post yaratish (/create, multipart + klient validatsiya), profil grid (PostThumb), post detail (/p/:id, carousel + edit/delete), AuthedMedia (blob orqali avtorizatsiyali media), nav "Yangi" ✓ |
| FE M4.5 engagement | DONE | LikeBar (heart toggle + sonlar), CommentSection (yozish + infinite ro'yxat + o'chirish), post detail'da composition; PostCard read-only count'lar olib tashlandi ✓ |
| FE M4.6 follow | DONE | FollowButton (profil header'da slot orqali, sikl yo'q), so'rovlar sahifasi (/requests, accept/reject), nav "So'rovlar" ✓ |
| FE M4.7 feed | DONE | bosh sahifa feed (FeedList: PostCard+LikeBar+izoh link), fallback'da SuggestedUsers, useToggleLike infinite ro'yxatlarni (feed/grid) sync qiladi ✓ |
| FE M4.8 admin | DONE | /admin panel (RequireAdmin guard): stats kartalar, users (qidiruv+block/unblock), posts moderatsiya (delete); nav "Admin" faqat ADMIN'da ✓ |

## Sifat standartlari

- TypeScript strict, `any` yo'q, ESLint + Prettier.
- Input validatsiya (class-validator); xato boshqaruvi (domain → HTTP kod + barqaror `code` enum).
- Sirlar faqat `.env`'da; parol bcrypt (cost ≥10); fayl MIME+magic-byte+hajm validatsiyasi.
- Swagger: barcha endpoint + DTO `@ApiProperty` + xato javoblari.
- Test: kritik oqimlar uchun ≥80%, behavior'ni test qil (implementatsiyani emas).

## Issue Reporting

```
ISSUE DETECTED
Type:     [Bug | Security | Performance | Architecture | FSD Violation]
Severity: [Critical | High | Medium | Low]
Location: path/to/file.ts:line
Problem: ...
Recommended Solution: ...
```

## Git konvensiyalar

```
feat(module): yangi funksionallik     fix(module): bug fix
refactor(scope): qayta tuzish          test(module): test
docs(scope): hujjat                    chore(deps): bog'liqlik
```
Branch: `feature/...`, `fix/...`. **main'ga to'g'ridan-to'g'ri push yo'q — PR orqali.**

## Konvensiyalar

- Naming: camelCase (o'zgaruvchi/funksiya), PascalCase (class/komponent), kebab-case (fayl).
- Backend exports: NestJS modul tizimi. FE exports: doim `index.ts` public API orqali.
- Default Server-side komponent yo'q (bu Vite SPA, Next.js emas).
