import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from './media.service';

/**
 * Yetim Cloudinary assetlarni davriy tozalash. DB'da posti yo'q Media
 * yozuvlarini topib, Cloudinary'dan o'chiradi.
 */
@Injectable()
export class MediaCleanupService {
  private readonly logger = new Logger(MediaCleanupService.name);

  constructor(
    private readonly media: MediaService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron(): Promise<void> {
    const removed = await this.sweepOrphans();
    if (removed > 0) {
      this.logger.log(`Cleanup: ${removed} ta yetim post o'chirildi`);
    }
  }

  async sweepOrphans(): Promise<number> {
    const orphanPosts = await this.prisma.post.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true },
    });

    let removed = 0;
    for (const { id } of orphanPosts) {
      await this.media.deletePostDir(id).catch(() => {});
      removed += 1;
    }
    return removed;
  }
}
