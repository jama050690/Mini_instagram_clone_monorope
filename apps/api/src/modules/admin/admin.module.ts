import { Module } from '@nestjs/common';
import { EngagementModule } from '../engagement/engagement.module';
import { PostsModule } from '../posts/posts.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PostsModule, EngagementModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
