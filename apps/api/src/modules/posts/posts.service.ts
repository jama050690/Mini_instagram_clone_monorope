import { HttpStatus, Injectable } from '@nestjs/common';
import { FollowStatus, MediaKind, PostType, Role, User } from '@prisma/client';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { buildPage, normalizeLimit, Page } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MediaService,
  type ImageExt,
  type VideoExt,
} from '../media/media.service';
import { NotificationService } from '../notifications/notification.service';
import { VisibilityService } from '../visibility/visibility.service';
import { PostView, postIncludeFor, toPostView } from './post.serializer';

const MAX_MEDIA = 10;
const POSTS_FORBIDDEN = 'Bu postlar faqat obunachilarga ko`rinadi';

interface ValidatedFile {
  file: Express.Multer.File;
  kind: MediaKind;
  ext: ImageExt | VideoExt;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly visibility: VisibilityService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Post + media yaratish (SRS 4.4). Avval barcha fayllar validatsiya qilinadi
   * (magic-byte + hajm), tur aniqlanadi (IMAGE/CAROUSEL/VIDEO), so'ng bitta
   * tranzaksiyada Post + Media yoziladi va fayllar diskka chiqariladi. Xatolik
   * bo'lsa → DB rollback + o'sha post papkasi o'chiriladi.
   */
  async create(
    author: User,
    caption: string | undefined,
    files: Express.Multer.File[],
  ): Promise<PostView> {
    if (!files || files.length === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_MEDIA_COUNT,
        'Kamida bitta fayl yuborilishi kerak',
      );
    }

    const validated: ValidatedFile[] = files.map((file) => ({
      file,
      ...this.media.validatePostMedia(file),
    }));
    const type = this.resolveType(validated);

    let createdPostId: string | undefined;
    try {
      const post = await this.prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: { authorId: author.id, caption: caption ?? null, type },
        });
        createdPostId = created.id;

        for (let order = 0; order < validated.length; order++) {
          const v = validated[order];
          const media = await tx.media.create({
            data: {
              postId: created.id,
              kind: v.kind,
              order,
              path: '',
              sizeBytes: v.file.size,
              mimeType: this.media.mimeFor(v.ext),
            },
          });
          const relPath = await this.media.storePostMedia(
            created.id,
            media.id,
            v.ext,
            this.media.process(v.file.buffer),
          );
          await tx.media.update({
            where: { id: media.id },
            data: { path: relPath },
          });
        }
        return created;
      });

      const postView = await this.getById(post.id, author);
      // Followerlarni async xabardor qilish (bloklamas)
      this.notifyFollowers(author.id, post.id).catch(() => {});
      return postView;
    } catch (err) {
      if (createdPostId) {
        await this.media.deletePostDir(createdPostId).catch(() => undefined);
      }
      throw err;
    }
  }

  private async notifyFollowers(authorId: string, postId: string): Promise<void> {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: authorId, status: FollowStatus.ACCEPTED },
      select: { followerId: true },
    });
    await Promise.all(
      followers.map((f) =>
        this.notifications.create({
          type: 'POST_CREATED',
          recipientId: f.followerId,
          actorId: authorId,
          postId,
        }),
      ),
    );
  }

  /** Bitta postni maxfiylikka bo'ysunib qaytaradi (404/403). */
  async getById(postId: string, viewer: User): Promise<PostView> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: postIncludeFor(viewer.id),
    });
    if (!post || post.deletedAt) {
      throw AppException.notFound('Post topilmadi');
    }
    if (post.author.isBlocked && post.author.id !== viewer.id) {
      throw AppException.notFound('Post topilmadi');
    }
    await this.visibility.assertCanViewContent(
      viewer.id,
      post.author,
      POSTS_FORBIDDEN,
    );
    return toPostView(post);
  }

  /**
   * Postni yuklaydi va viewer ko'ra oladimi tekshiradi (deleted/blocked → 404,
   * private non-follower → 403). Engagement (M4.5) shu orqali like/comment'ni
   * faqat ko'rinadigan postga ruxsat etadi. Minimal post ma'lumotini qaytaradi.
   */
  async assertViewablePost(
    postId: string,
    viewer: User,
  ): Promise<{ id: string; authorId: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        deletedAt: true,
        author: { select: { id: true, isPrivate: true, isBlocked: true } },
      },
    });
    if (!post || post.deletedAt) {
      throw AppException.notFound('Post topilmadi');
    }
    if (post.author.isBlocked && post.author.id !== viewer.id) {
      throw AppException.notFound('Post topilmadi');
    }
    await this.visibility.assertCanViewContent(
      viewer.id,
      post.author,
      POSTS_FORBIDDEN,
    );
    return { id: post.id, authorId: post.authorId };
  }

  /**
   * Profil grid'i: `username` egasining postlari (yangi → eski), cursor
   * pagination. Maxfiylik: private + non-follower → 403; bloklangan/yo'q → 404.
   */
  async listByAuthor(
    username: string,
    viewer: User,
    cursor?: string,
    limit?: number,
  ): Promise<Page<PostView>> {
    const author = await this.visibility.resolveVisibleUser(username, viewer);
    await this.visibility.assertCanViewContent(
      viewer.id,
      author,
      POSTS_FORBIDDEN,
    );

    const take = normalizeLimit(limit);
    const rows = await this.prisma.post.findMany({
      where: { authorId: author.id, deletedAt: null },
      include: postIncludeFor(viewer.id),
      // createdAt teng bo'lsa ham barqaror bo'lishi uchun id bilan tie-break.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const page = buildPage(rows, take, (row) => row.id);
    return { items: page.items.map(toPostView), nextCursor: page.nextCursor };
  }

  /** Caption tahrirlash — faqat egasi. Media o'zgarmaydi. */
  async updateCaption(
    postId: string,
    viewer: User,
    caption: string,
  ): Promise<PostView> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw AppException.notFound('Post topilmadi');
    }
    if (post.authorId !== viewer.id) {
      throw AppException.forbidden('Faqat post egasi tahrirlay oladi');
    }
    await this.prisma.post.update({
      where: { id: postId },
      data: { caption },
    });
    return this.getById(postId, viewer);
  }

  /**
   * Soft delete (`deletedAt`) + fayllarni diskdan o'chirish. Egasi yoki admin.
   * Idempotent emas: allaqachon o'chirilgan → 404.
   */
  async remove(postId: string, viewer: User): Promise<void> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw AppException.notFound('Post topilmadi');
    }
    const isOwner = post.authorId === viewer.id;
    if (!isOwner && viewer.role !== Role.ADMIN) {
      throw AppException.forbidden('Faqat egasi yoki admin o`chira oladi');
    }
    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
    await this.media.deletePostDir(postId).catch(() => undefined);
  }

  /** Fayllar tarkibidan post turini aniqlaydi (aralash/son qoidalari). */
  private resolveType(validated: ValidatedFile[]): PostType {
    const videos = validated.filter((v) => v.kind === 'VIDEO').length;
    const images = validated.length - videos;

    if (videos > 0 && images > 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.MIXED_MEDIA,
        'Rasm va video bir postda aralashtirilmaydi',
      );
    }
    if (videos > 0) {
      if (videos > 1) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_MEDIA_COUNT,
          'Bitta postda faqat bitta video bo`lishi mumkin',
        );
      }
      return PostType.VIDEO;
    }
    if (images > MAX_MEDIA) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_MEDIA_COUNT,
        `Rasmlar soni 1 dan ${MAX_MEDIA} gacha bo'lishi kerak`,
      );
    }
    return images === 1 ? PostType.IMAGE : PostType.CAROUSEL;
  }
}
