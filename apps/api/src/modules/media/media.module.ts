import { Module } from '@nestjs/common';
import { MediaCleanupService } from './media-cleanup.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaCleanupService],
  exports: [MediaService],
})
export class MediaModule {}
