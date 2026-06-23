import { Module } from '@nestjs/common';
import { HashtagModule } from '../hashtags/hashtag.module';
import { NotificationModule } from '../notifications/notification.module';
import { MediaModule } from '../media/media.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [MediaModule, NotificationModule, HashtagModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
