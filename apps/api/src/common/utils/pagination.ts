/**
 * Cursor-based pagination yordamchisi. Konvensiya: `?cursor=&limit=`,
 * javobda `nextCursor` (keyingi sahifa yo'q bo'lsa `null`).
 *
 * Ishlatish: `limit + 1` ta element so'ral, `buildPage` ortiqcha element
 * bo'yicha `nextCursor`ni hisoblaydi.
 */
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

/** `limit` ni xavfsiz oraliqqa (1..MAX_LIMIT) keltiradi (query string ham qabul qilinadi). */
export function normalizeLimit(limit?: number | string): number {
  const n = typeof limit === 'string' ? Number(limit) : limit;
  if (!n || Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * `limit + 1` ta yozuvdan sahifa quradi. Ortiqcha (limit+1-chi) yozuv bo'lsa,
 * uni olib tashlaydi va `cursorOf` orqali `nextCursor`ni belgilaydi.
 */
export function buildPage<T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => string,
): Page<T> {
  if (rows.length > limit) {
    const items = rows.slice(0, limit);
    return { items, nextCursor: cursorOf(items[items.length - 1]) };
  }
  return { items: rows, nextCursor: null };
}
