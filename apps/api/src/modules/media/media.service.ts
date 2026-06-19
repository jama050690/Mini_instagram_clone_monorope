import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { VisibilityService } from '../visibility/visibility.service';

/** `GET /media/:id` uchun Cloudinary URL ma'lumoti. */
export interface ServableMedia {
  url: string;
  mimeType: string;
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

const CLOUD_FOLDER = 'instagram-clone';

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  onModuleInit(): void {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    if (cloudName) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: this.config.get('CLOUDINARY_API_KEY', { infer: true }),
        api_secret: this.config.get('CLOUDINARY_API_SECRET', { infer: true }),
        secure: true,
      });
    }
  }

  /**
   * `GET /media/:id` uchun: media + post + egasini yuklaydi va viewer ko'ra
   * oladimi tekshiradi. O'chirilgan/bloklangan → 404; private + non-follower →
   * 403. Ruxsat bo'lsa Cloudinary URL qaytaradi.
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
    if (author.isBlocked && author.id !== viewerId) {
      throw AppException.notFound('Media topilmadi');
    }

    await this.visibility.assertCanViewContent(
      viewerId,
      author,
      'Bu media faqat obunachilarga ko`rinadi',
    );

    return { url: media.path, mimeType: media.mimeType };
  }

  /**
   * Image faylni magic-byte (kontent) va hajm bo'yicha tekshiradi.
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
   * Avatarni Cloudinary'ga yuklaydi. Avvalgi avatar o'chiriladi.
   * Cloudinary secure URL qaytaradi (User.avatarUrl'da saqlanadi).
   */
  async storeAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = this.validateImage(file, AVATAR_MAX_BYTES);
    await this.deleteAvatar(userId);

    const result = await this.uploadBuffer(
      file.buffer,
      `${CLOUD_FOLDER}/avatars/${userId}`,
      'image',
    );
    return result.secure_url;
  }

  /** Foydalanuvchining Cloudinary avatatrini o'chiradi. */
  async deleteAvatar(userId: string): Promise<void> {
    await cloudinary.uploader
      .destroy(`${CLOUD_FOLDER}/avatars/${userId}`, { resource_type: 'image' })
      .catch(() => {});
  }

  /**
   * Post media faylini magic-byte + hajm bo'yicha tekshiradi.
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
   * Post media faylini Cloudinary'ga yuklaydi.
   * Cloudinary secure URL qaytaradi (Media.path'da saqlanadi).
   */
  async storePostMedia(
    postId: string,
    mediaId: string,
    ext: string,
    buffer: Buffer,
  ): Promise<string> {
    const mime = this.mimeFor(ext as ImageExt | VideoExt);
    const resourceType = mime.startsWith('video') ? 'video' : 'image';

    const result = await this.uploadBuffer(
      buffer,
      `${CLOUD_FOLDER}/posts/${postId}/${mediaId}`,
      resourceType,
    );
    return result.secure_url;
  }

  /** Post papkasidagi barcha Cloudinary assetlarni o'chiradi. */
  async deletePostDir(postId: string): Promise<void> {
    const prefix = `${CLOUD_FOLDER}/posts/${postId}/`;
    await Promise.all([
      cloudinary.api
        .delete_resources_by_prefix(prefix, { resource_type: 'image' })
        .catch(() => {}),
      cloudinary.api
        .delete_resources_by_prefix(prefix, { resource_type: 'video' })
        .catch(() => {}),
    ]);
  }

  /** DB'dagi `Media.path` — endi Cloudinary URL sifatida saqlanadi. */
  resolveUploadPath(url: string): string {
    return url;
  }

  mimeFor(ext: ImageExt | VideoExt): string {
    return EXT_MIME[ext];
  }

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

  private uploadBuffer(
    buffer: Buffer,
    publicId: string,
    resourceType: 'image' | 'video',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { public_id: publicId, resource_type: resourceType, overwrite: true },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });
  }
}

/**
 * Video turini magic-byte bo'yicha aniqlaydi.
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
