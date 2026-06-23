import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { VisibilityModule } from './modules/visibility/visibility.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { MediaModule } from './modules/media/media.module';
import { PostsModule } from './modules/posts/posts.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { FollowModule } from './modules/follows/follow.module';
import { FeedModule } from './modules/feed/feed.module';
import { AdminModule } from './modules/admin/admin.module';
import { HashtagModule } from './modules/hashtags/hashtag.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { PushModule } from './modules/push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    VisibilityModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    MediaModule,
    PostsModule,
    EngagementModule,
    FollowModule,
    FeedModule,
    AdminModule,
    NotificationModule,
    PushModule,
    HashtagModule,
  ],
})
export class AppModule {}
