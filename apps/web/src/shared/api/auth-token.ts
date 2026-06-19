/**
 * Access token'ning yagona in-memory manbasi. FSD: `shared` qatlam `features`ni
 * import qila olmaydi, shuning uchun token shu yerda saqlanadi; auth store
 * (features/auth) uni shu yerga sinxronlaydi. Refresh tugaganda chaqiriladigan
 * "auth failure" handler ham shu yerda registratsiya qilinadi (app qatlamdan).
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

type AuthFailureHandler = () => void;
let onAuthFailure: AuthFailureHandler | null = null;

/** Refresh ham muvaffaqiyatsiz bo'lganda (sessiya tugadi) chaqiriladi. */
export function setAuthFailureHandler(handler: AuthFailureHandler | null): void {
  onAuthFailure = handler;
}

export function notifyAuthFailure(): void {
  onAuthFailure?.();
}
