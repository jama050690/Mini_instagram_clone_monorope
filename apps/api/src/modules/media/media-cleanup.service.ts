import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from './media.service';

/**
 * Yetim fayllarni davriy tozalash (SRS 4.3). `uploads/posts/` dagi DB'da posti
 * yo'q papkalarni o'chiradi — tranzaksion rollback yoki uzilishlardan qolgan
 * fayllar uchun xavfsizlik to'ri. Tranzaksiyaning o'zidagi tozalash M4'da.
 */
@Injectable()
export class MediaCleanupService {
  private readonly logger = new Logger(MediaCleanupService.name);

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly media: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron(): Promise<void> {
    const removed = await this.sweepOrphans();
    if (removed > 0) {
      this.logger.log(`Cleanup: ${removed} ta yetim post papkasi o'chirildi`);
    }
  }

  /** Yetim post papkalarini o'chiradi; o'chirilgan papkalar sonini qaytaradi. */
  async sweepOrphans(): Promise<number> {
    const postsDir = path.join(
      path.resolve(this.config.get('UPLOAD_DIR', { infer: true })),
      'posts',
    );

    let entries: string[];
    try {
      entries = await fs.readdir(postsDir);
    } catch {
      return 0; // papka hali yo'q
    }

    let removed = 0;
    for (const postId of entries) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        await this.media.deletePostDir(postId);
        removed += 1;
      }
    }
    return removed;
  }
}
