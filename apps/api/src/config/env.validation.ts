import { z } from 'zod';

/**
 * Env sxema. Ilova ko'tarilishidan oldin validatsiya qilinadi —
 * noto'g'ri/yetishmayotgan env bo'lsa, fail-fast (aniq xato bilan to'xtaydi).
 *
 * M0'da faqat asosiy infra env'lari. Auth/Google/Media env'lari mos modullarda
 * (M1, M3) qo'shiladi.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  // Faqat shu origin'ga CORS ruxsat (frontend)
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),

  // ── Auth (M1) ──
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  // Access token TTL (sekund), default 15 min
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  // Refresh token TTL (sekund), default 30 kun
  JWT_REFRESH_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  // Refresh cookie'ni secure qilish (prod'da true)
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // ── Cloudinary (media storage) ──
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // ── Google OAuth (ixtiyoriy — sozlanmasa /auth/google o'chiq) ──
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:3000/api/v1/auth/google/callback'),
  // Onboarding (registrationToken) TTL — sekund, default 10 min
  GOOGLE_ONBOARDING_TTL: z.coerce.number().int().positive().default(600),
  // Onboarding/auth tugagach FE qaysi manzilga redirect bo'ladi
  WEB_AUTH_REDIRECT: z
    .string()
    .url()
    .default('http://localhost:5173/auth/callback'),

  // ── Media (M2 avatar / M3) ──
  // Yuklangan fayllar saqlanadigan papka (process.cwd() ga nisbatan yoki absolute)
  UPLOAD_DIR: z.string().default('uploads'),
  // Avatar URL uchun server base URL (avatar public URL quriladi)
  API_BASE_URL: z.string().url().default('http://localhost:3000'),

  // ── Content Moderation (Google Cloud Vision SafeSearch) ──
  GOOGLE_CLOUD_VISION_KEY: z.string().optional(),

  // ── Web Push (VAPID) ──
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_MAILTO: z.string().default('mailto:admin@example.com'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * `@nestjs/config` `validate` hook'i uchun. Xato bo'lsa tushunarli xabar bilan
 * throw qiladi.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`❌ Env validatsiyasi muvaffaqiyatsiz:\n${issues}`);
  }
  return parsed.data;
}
