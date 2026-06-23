const HASHTAG_RE = /#([a-zA-Z0-9_Ѐ-ӿ]{1,100})/g;

/** Captiondan unikal lowercase hashtag nomlarini ajratib oladi. */
export function parseHashtags(caption: string | null | undefined): string[] {
  if (!caption) return [];
  const names = new Set<string>();
  for (const [, name] of caption.matchAll(HASHTAG_RE)) {
    names.add(name.toLowerCase());
  }
  return [...names];
}
