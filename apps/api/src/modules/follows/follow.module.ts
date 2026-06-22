import { Module } from '@nestjs/common';
import { NotificationModule } from '../notifications/notification.module';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';

@Module({
  imports: [NotificationModule],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
