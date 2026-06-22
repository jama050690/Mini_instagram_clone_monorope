import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { PostsModule } from '../posts/posts.module';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';

@Module({
  imports: [PostsModule, NotificationModule],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
