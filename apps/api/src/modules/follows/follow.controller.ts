import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Page } from '../../common/utils/pagination';
import { UserCard } from '../users/user-card.serializer';
import { FollowState } from './follow.serializer';
import { FollowService } from './follow.service';

@ApiTags('follow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FollowController {
  constructor(private readonly follow: FollowService) {}

  @Post('users/:username/follow')
  @HttpCode(200)
  @ApiOperation({ summary: 'Follow (public→accepted / private→pending)' })
  followUser(
    @Param('username') username: string,
    @CurrentUser() user: User,
  ): Promise<FollowState> {
    return this.follow.follow(user, username);
  }

  @Delete('users/:username/follow')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unfollow yoki pending so`rovni bekor qilish' })
  unfollowUser(
    @Param('username') username: string,
    @CurrentUser() user: User,
  ): Promise<FollowState> {
    return this.follow.unfollow(user, username);
  }

  @Get('follow/requests')
  @ApiOperation({ summary: 'Menga kelgan pending so`rovlar (cursor)' })
  requests(
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<Page<UserCard>> {
    return this.follow.listRequests(user, cursor, limit);
  }

  @Post('follow/requests/:userId/accept')
  @HttpCode(204)
  @ApiOperation({ summary: 'So`rovni tasdiqlash (PENDING→ACCEPTED)' })
  async accept(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.follow.acceptRequest(user, userId);
  }

  @Post('follow/requests/:userId/reject')
  @HttpCode(204)
  @ApiOperation({ summary: 'So`rovni rad etish (o`chiriladi)' })
  async reject(
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.follow.rejectRequest(user, userId);
  }
}
