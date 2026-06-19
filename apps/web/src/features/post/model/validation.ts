/**
 * Klient tomon media validatsiyasi (backend bilan bir xil qoidalar, SRS 4.3/4.4).
 * Server baribir magic-byte + hajmni qayta tekshiradi — bu faqat tez UX.
 */
export const CAPTION_MAX_LENGTH = 2200;
export const MAX_MEDIA = 10;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 20 * 1024 * 1024;

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface MediaSelection {
  files: File[];
  error: string | null;
}

/** Tanlangan fayllarni tekshiradi va tur (rasm/video) bir xilligini ta'minlaydi. */
export function validateSelection(files: File[]): MediaSelection {
  if (files.length === 0) {
    return { files, error: 'Kamida bitta fayl tanlang' };
  }

  const images = files.filter((f) => IMAGE_TYPES.includes(f.type));
  const videos = files.filter((f) => VIDEO_TYPES.includes(f.type));

  if (images.length + videos.length !== files.length) {
    return { files, error: 'Faqat rasm (jpg/png/webp) yoki video (mp4/webm/mov)' };
  }
  if (images.length > 0 && videos.length > 0) {
    return { files, error: 'Rasm va video bir postda aralashtirilmaydi' };
  }
  if (videos.length > 1) {
    return { files, error: 'Bitta postda faqat bitta video bo`lishi mumkin' };
  }
  if (images.length > MAX_MEDIA) {
    return { files, error: `Rasmlar soni ${MAX_MEDIA} tadan oshmasligi kerak` };
  }

  const oversizeImage = images.find((f) => f.size > IMAGE_MAX_BYTES);
  if (oversizeImage) {
    return { files, error: 'Rasm hajmi 5MB dan oshmasligi kerak' };
  }
  const oversizeVideo = videos.find((f) => f.size > VIDEO_MAX_BYTES);
  if (oversizeVideo) {
    return { files, error: 'Video hajmi 20MB dan oshmasligi kerak' };
  }

  return { files, error: null };
}
