# Texnik SRS — Kichik Instagram (MVP)

**Asos hujjat:** `Instagram_MVP_SRS.md` (biznes/funksional talablar)
**Hujjat turi:** Texnik spetsifikatsiya (arxitektura, ma'lumotlar modeli, API kontrakti, modul dizayni)
**Holat:** Ishlanmoqda — module-by-module kelishilmoqda

> Belgilar: ✅ = kelishildi, 🟡 = muhokamada, ⬜ = hali yozilmagan

---

## 0. Hujjat haqida

Ushbu hujjat biznes SRS'da bayon qilingan talablarni **texnik yechimga** aylantiradi: texnologiya steki, monorepo strukturasi, ma'lumotlar bazasi sxemasi, REST API kontrakti, har bir modulning ichki logikasi va edge-case yechimlari. Kod yozish faqat ushbu hujjat to'liq kelishilgandan **so'ng** boshlanadi.

---

## 1. Arxitektura umumiy ko'rinishi  ✅

### 1.1. Texnologiya steki

| Qatlam | Texnologiya |
|---|---|
| **Backend** | NestJS 11, TypeScript |
| **ORM / DB** | Prisma + PostgreSQL |
| **Auth** | JWT (access + refresh), Passport (local, jwt, google strategiyalari) |
| **Media storage** | Lokal disk (filesystem) — `apps/api/uploads/` |
| **Media processing** | MVP: siqishsiz. Bo'sh "process" hook qoldiriladi (keyin sharp/ffmpeg) |
| **Validation** | class-validator + class-transformer, global `ValidationPipe` |
| **API hujjati** | Swagger / OpenAPI (`@nestjs/swagger`) |
| **Frontend** | React + Vite + TypeScript |
| **UI** | Tailwind CSS + shadcn/ui |
| **Data layer (FE)** | TanStack Query + axios |
| **Routing (FE)** | React Router |
| **Forms (FE)** | react-hook-form + zod |
| **Realtime** | YO'Q (MVP) — polling. socket.io keyingi bosqich |
| **Deploy** | Docker + docker-compose (api, web, postgres) |

### 1.2. Monorepo strukturasi

```
project/
├─ apps/
│  ├─ api/                 # NestJS backend (hozirgi src/ shu yerga ko'chadi)
│  │  ├─ src/
│  │  │  ├─ modules/       # auth, users, profile, media, posts, follows, feed, admin
│  │  │  ├─ common/        # guards, filters, interceptors, decorators, pipes
│  │  │  ├─ prisma/        # PrismaService, schema.prisma, migrations
│  │  │  ├─ config/        # env validatsiya, konfiguratsiya
│  │  │  └─ main.ts
│  │  └─ uploads/          # lokal media (gitignore)
│  └─ web/                 # React + Vite frontend
│     └─ src/
│        ├─ features/      # auth, profile, post, feed, follow, admin
│        ├─ components/    # ui (shadcn), umumiy komponentlar
│        ├─ lib/           # api client (axios), query client, utils
│        └─ routes/
├─ package.json            # workspaces (apps/*)
└─ docker-compose.yml
```

### 1.3. Yuqori darajadagi oqim

```
[React (apps/web)]  --HTTP/REST (/api/v1)-->  [NestJS (apps/api)]  --Prisma-->  [PostgreSQL]
                                                      │
                                                      └── fayl yozish/o'qish ──> [uploads/ (disk)]
```

---

## 2. Cross-cutting konvensiyalar  ✅

### 2.1. API formati
- **Prefiks:** barcha endpointlar `/api/v1/...`
- **Auth:** `Authorization: Bearer <accessToken>`; refresh token **httpOnly cookie**'da
- **Standart javob (envelope):**
  ```json
  { "success": true, "data": { ... } }
  ```
- **Xato javobi:**
  ```json
  { "success": false, "error": { "code": "FORBIDDEN", "message": "...", "details": [ ... ] } }
  ```
- **Pagination:** cursor-based (`?cursor=<id>&limit=20`), javobda `nextCursor`.

### 2.2. Xato boshqaruvi
- Global `AllExceptionsFilter` — barcha xatolarni yuqoridagi envelope'ga keltiradi.
- Domain xatolar uchun aniq HTTP kodlar (400/401/403/404/409/422).
- `code` — barqaror string enum (FE shu bo'yicha xabar ko'rsatadi).

### 2.3. Validation
- DTO'larda `class-validator`; global `ValidationPipe({ whitelist: true, transform: true })`.
- Fayllar uchun maxsus validatsiya (hajm, MIME, kengaytma) — Media modulda.

### 2.4. Auth guard / ruxsat
- `JwtAuthGuard` — himoyalangan endpointlar.
- `RolesGuard` + `@Roles('ADMIN')` — admin endpointlar.
- `@CurrentUser()` decorator — joriy foydalanuvchini oladi.
- Bloklangan (`isBlocked`) foydalanuvchi hech qanday himoyalangan endpointga kira olmaydi (guardda tekshiriladi).

### 2.5. Konfiguratsiya
- `@nestjs/config` + env sxema validatsiyasi (zod yoki joi).
- Sirlar `.env`'da: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `UPLOAD_DIR`, va h.k.

---

## 3. Global ma'lumotlar modeli (ERD)  ✅

```
User 1──* Post 1──* Media
User 1──* Follow (follower)
User 1──* Follow (following)
```

### Entity'lar (yuqori daraja — batafsil sxema har modulda)

**User** — foydalanuvchi/admin (rol orqali farqlanadi)
`id, email(uniq), passwordHash?, googleId?(uniq), username(uniq), fullName, bio?, avatarUrl?, isPrivate, role(USER|ADMIN), isBlocked, createdAt, updatedAt`

**Post** — kontent posti
`id, authorId→User, caption?, type(IMAGE|CAROUSEL|VIDEO), status(PUBLISHED|FAILED), createdAt, updatedAt, deletedAt?(soft delete, admin moderatsiyasi)`

**Media** — postga tegishli fayl(lar) (karusel = bir nechta)
`id, postId→Post, kind(IMAGE|VIDEO), path, order, width?, height?, durationMs?, sizeBytes, mimeType, createdAt`

**Follow** — obuna munosabati
`id, followerId→User, followingId→User, status(PENDING|ACCEPTED), createdAt, updatedAt` — `unique(followerId, followingId)`

**RefreshToken** — sessiya/refresh token (rotatsiya bilan)
`id, userId→User, tokenHash, expiresAt, revokedAt?, userAgent?, ip?, createdAt`

> Feed uchun alohida jadval yo'q — query orqali (4.6'ga qarang).
> Notifications jadvali MVP'da yo'q — follow-request'lar query orqali ko'rsatiladi.

---

## 4. Modullar

### 4.1. Auth (Autentifikatsiya)  ✅

**Maqsad:** Email+Parol va Google OAuth orqali ro'yxatdan o'tish/kirish, JWT (access+refresh) sessiya, rotatsiyalanadigan refresh token.

#### Qarorlar
- **Refresh token:** DB'da `RefreshToken` jadvalida xeshlangan holda saqlanadi va har refresh'da **rotatsiya** qilinadi. Logout chinakam bekor qiladi.
- **Google OAuth username:** birinchi kirishda foydalanuvchi **username tanlash (onboarding)** qadamidan o'tadi — user faqat shundan keyin to'liq yaratiladi.
- **Email verification:** MVP'da YO'Q.
- **Token muddatlari:** access **15 min**, refresh **30 kun**.
- **Parol siyosati:** min **8** belgi; **bcrypt** (cost 10+) bilan xeshlanadi.

#### Endpointlar

| Method | Path | Body / Param | Tavsif | Guard |
|---|---|---|---|---|
| POST | `/auth/register` | `email, password, username, fullName` | Email/parol bilan ro'yxatdan o'tish → tokenlar | — |
| POST | `/auth/login` | `email, password` | Kirish → tokenlar | — |
| POST | `/auth/refresh` | refresh cookie | Access'ni yangilaydi + refresh rotatsiya | — |
| POST | `/auth/logout` | refresh cookie | Joriy refresh'ni bekor qiladi | JWT |
| GET | `/auth/google` | — | Google'ga redirect | — |
| GET | `/auth/google/callback` | Google code | Mavjud user → tokenlar; yangi → onboarding token | — |
| POST | `/auth/google/complete` | `registrationToken, username` | Onboarding: username bilan user yaratiladi → tokenlar | — |
| GET | `/auth/me` | — | Joriy foydalanuvchi profili | JWT |

#### Oqimlar
- **Register/Login:** validatsiya → (register) email/username unikal tekshiruvi → bcrypt → User yaratish → access+refresh berish (refresh httpOnly cookie + DB'da hash).
- **Refresh (rotation):** cookie'dagi refresh → DB'dagi hash bilan solishtirish → eski tokenni `revokedAt` qilish → yangi juftlik berish. Agar **bekor qilingan** token qayta ishlatilsa (reuse) → o'sha userning barcha sessiyalari bekor qilinadi (xavfsizlik).
- **Logout:** joriy refresh tokenni `revokedAt`, cookie tozalanadi.
- **Google (mavjud user):** googleId yoki email mos kelsa → akkauntga **ulanadi** (link), tokenlar beriladi.
- **Google (yangi user):** Google profil ma'lumotidan qisqa muddatli `registrationToken` (JWT) yaratiladi, FE onboarding ekraniga yo'naltiriladi → `username` tanlanib `/auth/google/complete` chaqiriladi → User yaratiladi. **DB'da username=null user qoldirilmaydi.**

#### Edge-case / qoidalar
- `email`/`username` unikal buzilsa → **409 CONFLICT** (`code: EMAIL_TAKEN` / `USERNAME_TAKEN`).
- Parollar hech qachon ochiq saqlanmaydi (bcrypt).
- `isBlocked = true` user kira olmaydi / himoyalangan endpointga kirolmaydi → **403** (`code: USER_BLOCKED`).
- OAuth-only user `passwordHash = null` bilan bo'ladi; login (email/parol) bunday userga ishlamaydi → tushunarli xato.

#### DB (Prisma — yuqori daraja)
- `User` (1.3 / 3-bo'limga qarang) — `passwordHash?`, `googleId?(uniq)`.
- `RefreshToken(id, userId, tokenHash, expiresAt, revokedAt?, userAgent?, ip?, createdAt)`.

---

### 4.2. Profile & Privacy  ✅

**Maqsad:** profil ko'rish/tahrirlash, avatar, Public/Private rejimi, foydalanuvchi qidirish.

#### Qarorlar
- **Private account ko'rinishi (non-follower):** profil "qobig'i" ko'rinadi — avatar, fullName, username, bio, follower/following **soni**. Lekin **postlar yashirin** (`"Ko'rish uchun obuna bo'ling"`).
- **Follower/following ro'yxati:** Public — hammaga ochiq; Private — faqat **tasdiqlangan obunachilar** va egasining o'ziga ko'rinadi (non-follower'ga 403, faqat son ko'rinadi).
- **Username** o'zgartirish mumkin (unikal tekshiruv bilan).
- **Avatar:** bitta rasm, max **2MB**, `jpg/png/webp`. Media modul pipeline'idan foydalanadi.
- **Qidiruv:** username/fullName bo'yicha user'lar (public + private) topiladi; lekin natijada private user'ning **postlari** hech qachon ko'rinmaydi. Bloklangan user qidiruvda chiqmaydi.

#### Endpointlar

| Method | Path | Tavsif | Guard |
|---|---|---|---|
| GET | `/users/search?q=&cursor=&limit=` | username/fullName bo'yicha qidirish | JWT |
| GET | `/users/:username` | profil ko'rish (maxfiylikka bo'ysunadi) | JWT |
| GET | `/users/:username/followers` | obunachilar ro'yxati (maxfiylik) | JWT |
| GET | `/users/:username/following` | obunalar ro'yxati (maxfiylik) | JWT |
| PATCH | `/profile` | fullName, username, bio | JWT |
| PATCH | `/profile/privacy` | `isPrivate` toggle | JWT |
| POST | `/profile/avatar` | avatar yuklash (multipart) | JWT |
| DELETE | `/profile/avatar` | avatarni o'chirish | JWT |

#### Profil ko'rish logikasi (`GET /users/:username`)
1. User topilmasa → 404.
2. `isBlocked` user → boshqalarga 404 (mavjud emasdek).
3. Public yoki (Private va `viewer` tasdiqlangan follower yoki egasi) → to'liq profil + postlarga ruxsat.
4. Private va viewer follower emas → profil qobig'i + `canViewPosts: false` flag, postlar bermaydi.
5. Javobda viewer uchun `relationship` holati: `self | following | requested | none`.

#### Edge-case / qoidalar
- `PATCH /profile/privacy` da **Private→Public** o'tilsa → barcha `PENDING` follow so'rovlari avtomatik `ACCEPTED` ga o'tadi (4.5 Follow modul logikasi chaqiriladi).
- **Public→Private** o'tilsa → mavjud `ACCEPTED` obunachilar saqlanadi (yangi so'rovlar endi pending bo'ladi).
- Username unikal buzilsa → 409 `USERNAME_TAKEN`.

#### DB
- Profil maydonlari `User`da (yangi jadval yo'q): `username, fullName, bio?, avatarUrl?, isPrivate`.

---

### 4.3. Media  ✅

**Maqsad:** rasm/video fayllarni qabul qilish, validatsiya, lokal diskka saqlash, avtorizatsiyali uzatish, yetim fayllarni tozalash. Siqish **yo'q** — bo'sh `process()` hook qoldiriladi (keyin sharp/ffmpeg shu yerga ulanadi).

#### Qarorlar
- **Yuklash oqimi:** **bitta multipart so'rov** — fayllar Post (yoki avatar) so'rovi ichida keladi; Media yozuvlari shu tranzaksiyada yaratiladi. Alohida `/media/upload` yo'q.
- **Uzatish:** **avtorizatsiyali** `GET /media/:id` — har so'rovda viewer postni ko'ra oladimi tekshiriladi, keyin fayl stream qilinadi. Ochiq static yo'q (private himoya).

#### Validatsiya
| Tur | Hajm | Format | Boshqa |
|---|---|---|---|
| Rasm | max 5MB | jpg, png, webp | post/avatar |
| Video | max 20MB | mp4, webm, quicktime | post |
| Karusel | — | rasm(lar) | 2–10 media |

- MIME + kengaytma + (rasm uchun) o'lcham `multer` + maxsus validator orqali tekshiriladi.
- Magic-byte tekshiruvi (faqat extension'ga ishonmaslik) — xavfsizlik.

#### Disk tartibi
```
uploads/
├─ posts/{postId}/{mediaId}.{ext}
└─ avatars/{userId}.{ext}
```
- `.env`: `UPLOAD_DIR` (default `apps/api/uploads`). `uploads/` → `.gitignore`.

#### Endpointlar

| Method | Path | Tavsif | Guard |
|---|---|---|---|
| GET | `/media/:id` | media faylni stream qilish (avtorizatsiya bilan) | JWT |

> Yuklash endpointi yo'q — fayllar `POST /posts` va `POST /profile/avatar` ichida keladi. Media — asosan `MediaService` (validate/store/delete) + serving + cleanup.

#### `GET /media/:id` logikasi
1. Media + tegishli Post topiladi (yoki avatar).
2. Post `deletedAt != null` → 404.
3. Egasining posti yoki public post → ruxsat.
4. Private post → viewer tasdiqlangan follower bo'lishi shart, aks holda → 403.
5. To'g'ri `Content-Type` + `Cache-Control` bilan stream (`fs.createReadStream`), Range so'rovlarini (video uchun) qo'llab-quvvatlaydi.

#### Yetim fayllarni tozalash (SRS edge-case 3)
- **Tranzaksion himoya:** post yaratish muvaffaqiyatsiz bo'lsa → DB rollback + o'sha so'rovda yozilgan barcha fayllar o'chiriladi (`try/finally`).
- **Davriy sweep:** `@nestjs/schedule` cron (mas. har kun) — `uploads/` dagi DB'da havolasi yo'q fayllarni va media-siz qolgan post papkalarini tozalaydi.

#### `process()` hook
- `MediaService.process(file)` — hozir **no-op** (faylni shundayligicha saqlaydi). Kelajakda rasm siqish / video transcoding shu metodga qo'shiladi, qolgan kod o'zgarmaydi.

#### DB
- `Media(id, postId→Post, kind(IMAGE|VIDEO), path, order, width?, height?, durationMs?, sizeBytes, mimeType, createdAt)`.
- Avatar `User.avatarUrl`da (alohida Media yozuvi shart emas).

---

### 4.4. Post (Kontent yaratish)  ✅

**Maqsad:** caption bilan rasm/karusel/video post yaratish, ko'rish, tahrirlash (caption), o'chirish.

#### Qarorlar
- **Post turi avtomatik:** 1 rasm → `IMAGE`; 2–10 rasm → `CAROUSEL`; 1 video → `VIDEO`. Aralash (rasm+video) karusel **yo'q**.
- **Caption tahrirlash:** ha — faqat caption matni o'zgaradi (media o'zgarmaydi).
- **O'chirish:** soft delete (`deletedAt`) + fayllarni diskdan o'chirish. Egasi yoki admin.
- Caption max **2200** belgi (ixtiyoriy — captionsiz post ham mumkin).

#### Endpointlar

| Method | Path | Body / Param | Tavsif | Guard |
|---|---|---|---|---|
| POST | `/posts` | multipart: `caption?`, `files[]` | post + media yaratish (tranzaksion) | JWT |
| GET | `/posts/:id` | — | bitta post (maxfiylik) | JWT |
| GET | `/users/:username/posts` | `cursor, limit` | profil grid (maxfiylik, paginated) | JWT |
| PATCH | `/posts/:id` | `caption` | caption tahrirlash | JWT (egasi) |
| DELETE | `/posts/:id` | — | o'chirish (soft) | JWT (egasi/admin) |

#### `POST /posts` oqimi (tranzaksion)
1. Fayllar validatsiyasi (Media modul: hajm, MIME, magic-byte, son 1–10 / video=1).
2. `Post` yozuvi yaratiladi (status `PUBLISHED`).
3. Har fayl `process()` (no-op) → `uploads/posts/{postId}/` ga yoziladi → `Media` yozuvi (`order` bilan).
4. Hammasi bitta DB tranzaksiyasida; xatolik → rollback + yozilgan fayllarni o'chirish.

#### Ko'rish maxfiyligi
- `GET /posts/:id` va `GET /users/:username/posts` — post egasi public yoki viewer tasdiqlangan follower bo'lsa ko'rsatiladi; aks holda 403/yashirin. `deletedAt != null` → 404.

#### Javob shakli (Post DTO)
`id, author{id,username,avatarUrl}, caption, type, media[{id,kind,order,url}], likeCount, commentCount, likedByMe, createdAt`
> `url` → `/api/v1/media/:id` (avtorizatsiyali). `likeCount/commentCount/likedByMe` — Engagement modul (4.5).

#### DB
- `Post(id, authorId→User, caption?, type(IMAGE|CAROUSEL|VIDEO), status(PUBLISHED|FAILED), createdAt, updatedAt, deletedAt?)`.

---

### 4.5. Engagement (Like & Comment)  ✅

**Maqsad:** postlarga like bosish va izoh yozish.

#### Qarorlar
- **Comment:** flat (tekis) — reply yo'q. Max **1000** belgi.
- **Like:** faqat **son** + `likedByMe` ko'rsatiladi; alohida "likers" ro'yxati endpointi yo'q.
- **Maxfiylik:** like/comment faqat viewer **ko'ra oladigan** postga (public yoki tasdiqlangan follower) mumkin — aks holda 403.

#### Endpointlar

| Method | Path | Tavsif | Guard |
|---|---|---|---|
| POST | `/posts/:id/like` | like bosish (idempotent) | JWT |
| DELETE | `/posts/:id/like` | like olib tashlash | JWT |
| POST | `/posts/:id/comments` | `text` — izoh qo'shish | JWT |
| GET | `/posts/:id/comments?cursor=&limit=` | izohlar ro'yxati (paginated) | JWT |
| DELETE | `/comments/:id` | izohni o'chirish | JWT (egasi/post egasi/admin) |

#### Qoidalar
- `Like` — `unique(userId, postId)`; takror like → idempotent (xato emas).
- `likeCount` / `commentCount` — query'da `_count` orqali olinadi (alohida counter ustun emas, MVP).
- Comment o'chirish: izoh egasi, **post egasi**, yoki admin.
- Post soft-delete bo'lsa, like/comment endpointlari 404.

#### DB
- `Like(id, userId→User, postId→Post, createdAt)` — `unique(userId, postId)`.
- `Comment(id, postId→Post, authorId→User, text, createdAt, deletedAt?)`.

---

### 4.6. Follow (Obunalar)  ✅

**Maqsad:** obuna bo'lish/bekor qilish, private akkauntlar uchun so'rovlar (request) tizimi.

#### Qarorlar
- **Public akkaunt:** Follow → darhol `ACCEPTED`.
- **Private akkaunt:** Follow → `PENDING` (Follow Request).
- **Self-follow yo'q**, bloklangan user bilan follow munosabati yo'q.
- **Remove follower** (obunachini chetlatish) — MVP'da yo'q (keyin qo'shsa bo'ladi).

#### Endpointlar

| Method | Path | Tavsif | Guard |
|---|---|---|---|
| POST | `/users/:username/follow` | follow (public→accepted / private→pending) | JWT |
| DELETE | `/users/:username/follow` | unfollow yoki pending so'rovni bekor qilish | JWT |
| GET | `/follow/requests?cursor=&limit=` | menga kelgan pending so'rovlar | JWT |
| POST | `/follow/requests/:userId/accept` | so'rovni tasdiqlash | JWT |
| POST | `/follow/requests/:userId/reject` | so'rovni rad etish (o'chiriladi) | JWT |

#### Logika
- `POST follow`: agar yozuv mavjud bo'lsa idempotent (joriy holatni qaytaradi). Aks holda target public → `ACCEPTED`, private → `PENDING`.
- `DELETE follow`: yozuvni o'chiradi (ACCEPTED bo'lsa unfollow, PENDING bo'lsa so'rovni bekor qilish — bir xil amal).
- `accept`: `PENDING → ACCEPTED` (faqat target egasi).
- `reject`: PENDING yozuvni o'chiradi (faqat target egasi).
- **Counts:** `followerCount` / `followingCount` faqat `ACCEPTED` yozuvlardan; pending hisobga olinmaydi.

#### Edge-case (SRS 6.1) — Private→Public o'tganda
- `ProfileService.setPrivacy(false)` → `FollowService.acceptAllPending(userId)`: barcha `followingId = userId, status = PENDING` yozuvlar bitta `updateMany` bilan `ACCEPTED` ga o'tadi. So'rovlar ro'yxati avtomatik bo'shaydi.

#### DB
- `Follow(id, followerId→User, followingId→User, status(PENDING|ACCEPTED), createdAt, updatedAt)` — `unique(followerId, followingId)`, indekslar: `(followingId, status)`, `(followerId, status)`.

---

### 4.7. Feed (Lenta)  ✅

**Maqsad:** sof xronologik lenta — obuna bo'lgan (tasdiqlangan) foydalanuvchilarning postlari, eng yangisidan.

#### Qarorlar
- **Manba:** viewer `ACCEPTED` follow qilgan userlar **+ o'zining postlari**.
- **Tartib:** `createdAt DESC, id DESC` (cursor-based pagination).
- **Bo'sh feed (SRS 6.2):** obuna yo'q / post yo'q bo'lsa → so'nggi **public** postlar (fallback) `isFallback: true` flag bilan; alohida **tavsiya etilgan profillar** endpointi UI uchun.
- Alohida feed jadvali yo'q — query orqali (MVP hajmida yetarli). Indekslar query'ni tez qiladi.

#### Endpointlar

| Method | Path | Tavsif | Guard |
|---|---|---|---|
| GET | `/feed?cursor=&limit=` | xronologik lenta (yoki bo'sh bo'lsa fallback) | JWT |
| GET | `/users/suggested?limit=` | tavsiya etilgan public profillar | JWT |

#### Logika
- `GET /feed`:
  1. `followingIds` = `Follow(followerId=me, status=ACCEPTED).followingId` + `me`.
  2. `Post where authorId IN followingIds AND deletedAt IS NULL ORDER BY createdAt DESC, id DESC LIMIT n+1` (cursor bilan).
  3. Natija bo'sh bo'lsa → so'nggi public postlar (public author, deletedAt null) qaytariladi, `isFallback: true`.
- `GET /users/suggested`: viewer follow qilmagan, bloklanmagan **public** profillar (mas. eng ko'p followerli yoki eng yangi) — bo'sh feed holati UI uchun.
- Javob har post uchun to'liq Post DTO (4.4) — `likeCount/commentCount/likedByMe` bilan.

#### DB
- Yangi jadval yo'q. `Post(authorId, createdAt)` va `Follow(followerId, status)` indekslari yetarli.

---

### 4.8. Admin  ✅

**Maqsad:** yagona admin uchun statistika, foydalanuvchi bloklash, kontent moderatsiyasi.

#### Qarorlar
- **Yagona admin:** `User.role = ADMIN`. Admin **seed** script orqali yaratiladi (`ADMIN_EMAIL` / `ADMIN_PASSWORD` env'dan). Iyerarxiya yo'q (SRS 4-bo'lim).
- **Block:** `isBlocked` toggle (qaytariladigan). Bloklangan user kira olmaydi (Auth guard) va uning profili/postlari boshqalarga ko'rinmaydi (404 / feed va qidiruvdan chiqarib tashlanadi).
- **Post o'chirish:** soft delete (`deletedAt`) — moderatsiya izi qoladi.
- Barcha `/admin/*` endpointlar `JwtAuthGuard + RolesGuard('ADMIN')` bilan himoyalangan.

#### Endpointlar

| Method | Path | Tavsif |
|---|---|---|
| GET | `/admin/stats` | dashboard statistikasi |
| GET | `/admin/users?search=&cursor=&limit=` | foydalanuvchilar ro'yxati |
| GET | `/admin/users/:id` | bitta user (batafsil) |
| PATCH | `/admin/users/:id/block` | bloklash |
| PATCH | `/admin/users/:id/unblock` | blokdan chiqarish |
| GET | `/admin/posts?cursor=&limit=` | postlar ro'yxati (moderatsiya) |
| DELETE | `/admin/posts/:id` | postni o'chirish (soft) |
| DELETE | `/admin/comments/:id` | izohni o'chirish |

#### `GET /admin/stats` (taklif)
`totalUsers, blockedUsers, totalPosts (active), totalComments, newUsers7d, newPosts7d, privateVsPublic`.

#### Edge / qoidalar
- Admin o'zini bloklay olmaydi.
- Bloklangan user `isBlocked=true` — barcha himoyalangan endpointlarda 403; profil/post/feed/qidiruvdan yashirin.
- Admin post/comment o'chirsa → diskdan fayllar ham tozalanadi (post uchun).

#### DB
- Yangi jadval yo'q (`User.role`, `User.isBlocked`, `Post.deletedAt`, `Comment.deletedAt`).
- (Ixtiyoriy, keyin) `ModerationLog` — kim nimani o'chirgani. MVP'da yo'q.

---


## 5. Non-funksional talablar  ✅

### 5.1. Xavfsizlik
- Parollar **bcrypt** (cost ≥10) bilan xeshlanadi; ochiq saqlanmaydi.
- JWT secret'lar env'da; access qisqa muddatli, refresh DB'da xeshlangan + rotatsiya.
- Refresh token **httpOnly + secure + sameSite** cookie'da (XSS/CSRF himoyasi).
- Google OAuth tokenlari saqlanmaydi — faqat profil ma'lumoti olinib, o'z JWT'imiz beriladi.
- Fayl yuklash: MIME + magic-byte + hajm validatsiyasi; nom UUID asosida (path traversal yo'q).
- **Rate limiting** (`@nestjs/throttler`): auth endpointlariga qattiqroq limit (brute-force himoyasi).
- Helmet, CORS (faqat frontend origin'iga ruxsat).
- Private kontent har doim avtorizatsiyali endpoint orqali (Media 4.3).

### 5.2. Ishlash tezligi (Performance)
- DB indekslar: `User(username, email)`, `Post(authorId, createdAt)`, `Follow(followingId,status)/(followerId,status)`, `Like(userId,postId)`, `Comment(postId,createdAt)`.
- Cursor-based pagination (offset emas) — katta jadvalda barqaror tezlik.
- N+1 oldini olish: Prisma `include`/`select` + `_count`.
- Media `Cache-Control` + Range (video stream).
- (Siqish MVP'da yo'q — `process()` hook keyin qo'shiladi.)

### 5.3. Deploy
- **docker-compose:** `api` (NestJS), `web` (React/nginx), `db` (Postgres). `uploads/` — volume (persist).
- Prisma migration: `prisma migrate deploy` (prod), `migrate dev` (lokal).
- Env'lar `.env` orqali; misol `.env.example` repoda.
- Healthcheck endpoint: `GET /health`.

### 5.4. UX/UI
- Responsive (mobile-first), Tailwind breakpoints.
- Loading/empty/error holatlari har ekranda (bo'sh feed → suggested profiles).

---

## 6. Frontend arxitektura (apps/web)  ✅

### 6.1. Stek
React + Vite + TS, Tailwind + shadcn/ui, TanStack Query (server state), React Router, react-hook-form + zod, axios (interceptor: access token qo'shadi, 401'da refresh).

### 6.2. Asosiy route'lar
| Route | Sahifa | Guard |
|---|---|---|
| `/login`, `/register` | auth | guest |
| `/onboarding/username` | Google sozlash | yarim-auth |
| `/` | Feed | auth |
| `/explore` | suggested/public | auth |
| `/search` | user qidiruv | auth |
| `/create` | post yaratish | auth |
| `/p/:postId` | post detali | auth |
| `/u/:username` | profil | auth |
| `/u/:username/followers`/`following` | ro'yxatlar | auth |
| `/requests` | follow so'rovlari | auth |
| `/settings` | profil/maxfiylik tahrir | auth |
| `/admin/*` | admin panel (stats, users, posts) | admin |

### 6.3. Konvensiyalar
- `features/` papkasida har modul: api (hooks), components, pages.
- Markaziy `apiClient` + auth interceptor; `queryClient` invalidation kalitlari.
- Token: access — memory/state; refresh — httpOnly cookie (FE ko'rmaydi).

---

## 7. Implementatsiya tartibi (build plan)  ✅

Module-by-module, har bosqich tasdiqlanadi. TDD (`tdd` skill) bilan integratsiya testlari.

1. **M0 — Core/Infra:** monorepo (apps/api + apps/web), Prisma + Postgres (docker), config/env validatsiya, global filter/pipe/interceptor, Swagger, health.
2. **M1 — Auth:** User+RefreshToken schema, register/login/refresh/logout, JWT guards, `@CurrentUser`, Google OAuth + onboarding.
3. **M2 — Profile:** profil ko'rish/tahrir, privacy toggle, avatar, qidiruv.
4. **M3 — Media:** MediaService (validate/store/process-hook), `GET /media/:id`, cleanup cron.
5. **M4 — Post:** create (multipart, tranzaksion), view/grid, edit caption, delete.
6. **M4.5 — Engagement:** like toggle, comment CRUD.
7. **M4.6 — Follow:** follow/unfollow, requests, accept/reject, private→public auto-accept.
8. **M4.7 — Feed:** chronological + fallback + suggested.
9. **M4.8 — Admin:** seed admin, stats, user block, moderation.
10. **Frontend:** har backend modul bilan parallel yoki ketma-ket (kelishamiz).
11. **Deploy:** docker-compose, .env.example, README.

---

## 8. Appendix — to'liq Prisma schema (taklif)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { USER ADMIN }
enum PostType { IMAGE CAROUSEL VIDEO }
enum PostStatus { PUBLISHED FAILED }
enum MediaKind { IMAGE VIDEO }
enum FollowStatus { PENDING ACCEPTED }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  googleId     String?  @unique
  username     String   @unique
  fullName     String
  bio          String?
  avatarUrl    String?
  isPrivate    Boolean  @default(false)
  role         Role     @default(USER)
  isBlocked    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  posts        Post[]
  comments     Comment[]
  likes        Like[]
  refreshTokens RefreshToken[]
  following    Follow[] @relation("follower")
  followers    Follow[] @relation("following")
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String
  expiresAt DateTime
  revokedAt DateTime?
  userAgent String?
  ip        String?
  createdAt DateTime @default(now())
  @@index([userId])
}

model Post {
  id        String     @id @default(cuid())
  authorId  String
  author    User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  caption   String?
  type      PostType
  status    PostStatus @default(PUBLISHED)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  deletedAt DateTime?

  media     Media[]
  comments  Comment[]
  likes     Like[]
  @@index([authorId, createdAt])
}

model Media {
  id        String    @id @default(cuid())
  postId    String
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  kind      MediaKind
  path      String
  order     Int       @default(0)
  width     Int?
  height    Int?
  durationMs Int?
  sizeBytes Int
  mimeType  String
  createdAt DateTime  @default(now())
  @@index([postId])
}

model Follow {
  id          String       @id @default(cuid())
  followerId  String
  followingId String
  follower    User         @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User         @relation("following", fields: [followingId], references: [id], onDelete: Cascade)
  status      FollowStatus @default(ACCEPTED)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  @@unique([followerId, followingId])
  @@index([followingId, status])
  @@index([followerId, status])
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, postId])
  @@index([postId])
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  authorId  String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  text      String
  createdAt DateTime @default(now())
  deletedAt DateTime?
  @@index([postId, createdAt])
}
```
