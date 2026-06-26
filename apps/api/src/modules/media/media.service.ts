import * as fs from 'fs';
import * as path from 'path';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { VisibilityService } from '../visibility/visibility.service';
import { ContentModerationService } from './content-moderation.service';

export interface ServableMedia {
  absPath: string;
  mimeType: string;
}

export type ImageExt = 'jpg' | 'png' | 'webp';
export type VideoExt = 'mp4' | 'webm' | 'mov';
export type MediaKind = 'IMAGE' | 'VIDEO';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const POST_VIDEO_MAX_BYTES = 20 * 1024 * 1024;

export interface ValidatedMedia {
  kind: MediaKind;
  ext: ImageExt | VideoExt;
}

const EXT_MIME: Record<ImageExt | VideoExt, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

@Injectable()
export class MediaService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly moderation: ContentModerationService,
  ) {
    const configured = this.config.get('UPLOAD_DIR', { infer: true });
    this.uploadDir = path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);

    this.baseUrl = this.config.get('API_BASE_URL', { infer: true });
  }

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

    return { absPath: media.path, mimeType: media.mimeType };
  }

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

  async moderateImage(buffer: Buffer): Promise<void> {
    await this.moderation.checkImage(buffer);
  }

  async storeAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = this.validateImage(file, AVATAR_MAX_BYTES);
    await this.moderation.checkImage(file.buffer);
    await this.deleteAvatar(userId);

    const dir = path.join(this.uploadDir, 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${userId}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    return `${this.baseUrl}/uploads/avatars/${filename}`;
  }

  async deleteAvatar(userId: string): Promise<void> {
    const dir = path.join(this.uploadDir, 'avatars');
    for (const ext of ['jpg', 'png', 'webp'] as ImageExt[]) {
      const filePath = path.join(dir, `${userId}.${ext}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

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

  async storePostMedia(
    postId: string,
    mediaId: string,
    ext: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = path.join(this.uploadDir, 'posts', postId);
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${mediaId}.${ext}`;
    const absPath = path.join(dir, filename);
    fs.writeFileSync(absPath, buffer);
    return absPath;
  }

  async deletePostDir(postId: string): Promise<void> {
    const dir = path.join(this.uploadDir, 'posts', postId);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  resolveUploadPath(absPath: string): string {
    return absPath;
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
}

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
