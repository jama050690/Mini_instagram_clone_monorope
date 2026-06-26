import { Module } from '@nestjs/common';
import { ContentModerationService } from './content-moderation.service';
import { MediaCleanupService } from './media-cleanup.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaCleanupService, ContentModerationService],
  exports: [MediaService],
})
export class MediaModule {}
