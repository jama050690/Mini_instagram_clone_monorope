import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { VisibilityService } from '../visibility/visibility.service';

/** `GET /media/:id` uchun stream qilinadigan fayl ma'lumoti. */
export interface ServableMedia {
  absPath: string;
  mimeType: string;
  sizeBytes: number;
}

export type ImageExt = 'jpg' | 'png' | 'webp';
export type VideoExt = 'mp4' | 'webm' | 'mov';
export type MediaKind = 'IMAGE' | 'VIDEO';

/** Cheklovlar (SRS 4.3): avatar 2MB, post rasm 5MB, post video 20MB. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const POST_VIDEO_MAX_BYTES = 20 * 1024 * 1024;

export interface ValidatedMedia {
  kind: MediaKind;
  ext: ImageExt | VideoExt;
}

/** Validatsiyalangan kengaytma → MIME (DB'da Media.mimeType uchun). */
const EXT_MIME: Record<ImageExt | VideoExt, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

/**
 * Media fayllarni validatsiya/saqlash. M2'da faqat avatar (image) ishlatiladi;
 * M3'da post media (video + serving + cleanup) shu yerga qo'shiladi. `process()`
 * hook hozircha no-op (kelajakda siqish/transcoding).
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  /**
   * `GET /media/:id` uchun: media + post + egasini yuklaydi va viewer ko'ra
   * oladimi tekshiradi. O'chirilgan/bloklangan → 404; private + non-follower →
   * 403. Ruxsat bo'lsa stream qilinadigan fayl ma'lumotini qaytaradi.
   */
  async resolveForViewer(
    mediaId: string,
    viewerId: string,
  ): Promise<ServableMedia> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { post: { include: { author: true } } },
    });

    const post = media?.post;
    const author = post?.author;
    if (!media || !post || !author || post.deletedAt) {
      throw AppException.notFound('Media topilmadi');
    }
    // Bloklangan egasining mediasi boshqalarga ko'rinmaydi
    if (author.isBlocked && author.id !== viewerId) {
      throw AppException.notFound('Media topilmadi');
    }

    await this.visibility.assertCanViewContent(
      viewerId,
      author,
      'Bu media faqat obunachilarga ko`rinadi',
    );

    return {
      absPath: this.resolveUploadPath(media.path),
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
    };
  }

  /**
   * Image faylni magic-byte (kontent) va hajm bo'yicha tekshiradi. Faqat
   * extension'ga ishonmaymiz — bu xavfsizlik talabi (SRS). Topilgan haqiqiy
   * kengaytmani qaytaradi.
   */
  validateImage(file: Express.Multer.File, maxBytes: number): ImageExt {
    if (file.size > maxBytes) {
      throw new AppException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        ErrorCode.FILE_TOO_LARGE,
        `Fayl hajmi ${Math.round(maxBytes / 1024 / 1024)}MB dan oshmasligi kerak`,
      );
    }
    const ext = detectImageType(file.buffer);
    if (!ext) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_FILE_TYPE,
        'Faqat jpg, png yoki webp ruxsat etiladi',
      );
    }
    return ext;
  }

  /**
   * Avatarni `${UPLOAD_DIR}/avatars/{userId}.{ext}` ga yozadi. Avvalgi (boshqa
   * kengaytmali) avatar bo'lsa o'chiriladi. Servga yaroqli public yo'lni
   * qaytaradi (`/uploads/avatars/{userId}.{ext}`).
   */
  async storeAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = this.validateImage(file, AVATAR_MAX_BYTES);
    await this.deleteAvatar(userId);

    const dir = this.avatarDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${userId}.${ext}`), file.buffer);

    return `/uploads/avatars/${userId}.${ext}`;
  }

  /** Foydalanuvchining avatar fayl(lar)ini o'chiradi (qaysi kengaytma bo'lsa ham). */
  async deleteAvatar(userId: string): Promise<void> {
    const dir = this.avatarDir();
    await Promise.all(
      (['jpg', 'png', 'webp'] as ImageExt[]).map((ext) =>
        fs.rm(path.join(dir, `${userId}.${ext}`), { force: true }),
      ),
    );
  }

  /**
   * Post media faylini (rasm yoki video) magic-byte + hajm bo'yicha tekshiradi.
   * Rasm ≤5MB, video ≤20MB. Topilgan kind + kengaytmani qaytaradi.
   */
  validatePostMedia(file: Express.Multer.File): ValidatedMedia {
    const imageExt = detectImageType(file.buffer);
    if (imageExt) {
      this.assertSize(file, POST_IMAGE_MAX_BYTES);
      return { kind: 'IMAGE', ext: imageExt };
    }
    const videoExt = detectVideoType(file.buffer);
    if (videoExt) {
      this.assertSize(file, POST_VIDEO_MAX_BYTES);
      return { kind: 'VIDEO', ext: videoExt };
    }
    throw new AppException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_FILE_TYPE,
      'Faqat rasm (jpg/png/webp) yoki video (mp4/webm/mov) ruxsat etiladi',
    );
  }

  /**
   * Post media faylini `${UPLOAD_DIR}/posts/{postId}/{mediaId}.{ext}` ga yozadi.
   * DB'da saqlanadigan nisbiy `path`ni qaytaradi.
   */
  async storePostMedia(
    postId: string,
    mediaId: string,
    ext: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = path.join(this.uploadDir(), 'posts', postId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${mediaId}.${ext}`), buffer);
    return `posts/${postId}/${mediaId}.${ext}`;
  }

  /** Post papkasini butunlay o'chiradi (tranzaksion rollback / cleanup uchun). */
  async deletePostDir(postId: string): Promise<void> {
    await fs.rm(path.join(this.uploadDir(), 'posts', postId), {
      recursive: true,
      force: true,
    });
  }

  /** DB'dagi nisbiy `path`dan absolyut fayl yo'lini beradi (streaming uchun). */
  resolveUploadPath(relativePath: string): string {
    return path.join(this.uploadDir(), relativePath);
  }

  /**
   * Validatsiyalangan kengaytmadan MIME turini beradi. `file.mimetype`ga
   * (mijoz yuboradi, ishonchsiz) emas, magic-byte natijasiga tayanamiz.
   */
  mimeFor(ext: ImageExt | VideoExt): string {
    return EXT_MIME[ext];
  }

  /**
   * Kelajakda rasm siqish / video transcoding shu yerga qo'shiladi. Hozircha
   * no-op — fayl shundayligicha saqlanadi (SRS).
   */
  process(buffer: Buffer): Buffer {
    return buffer;
  }

  private assertSize(file: Express.Multer.File, maxBytes: number): void {
    if (file.size > maxBytes) {
      throw new AppException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        ErrorCode.FILE_TOO_LARGE,
        `Fayl hajmi ${Math.round(maxBytes / 1024 / 1024)}MB dan oshmasligi kerak`,
      );
    }
  }

  private uploadDir(): string {
    return path.resolve(this.config.get('UPLOAD_DIR', { infer: true }));
  }

  private avatarDir(): string {
    return path.join(this.uploadDir(), 'avatars');
  }
}

/**
 * Video turini magic-byte bo'yicha aniqlaydi. mp4/mov: offset 4-8 = "ftyp"
 * (brand "qt  " → mov, aks holda mp4); webm: EBML 1A 45 DF A3.
 */
export function detectVideoType(buf: Buffer): VideoExt | null {
  if (
    buf.length >= 4 &&
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  ) {
    return 'webm';
  }
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    return brand === 'qt  ' ? 'mov' : 'mp4';
  }
  return null;
}

/**
 * Buffer boshidagi magic-byte'lar bo'yicha image turini aniqlaydi.
 * Faqat 3 format — tashqi kutubxonasiz, ESM muammosisiz.
 */
export function detectImageType(buf: Buffer): ImageExt | null {
  if (
    buf.length >= 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return 'jpg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}
