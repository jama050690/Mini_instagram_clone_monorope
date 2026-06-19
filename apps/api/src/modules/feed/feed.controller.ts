import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FeedPage, FeedService } from './feed.service';

@ApiTags('feed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get()
  @ApiOperation({
    summary: 'Xronologik lenta (bo`sh bo`lsa fallback public postlar)',
  })
  getFeed(
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<FeedPage> {
    return this.feed.getFeed(user, cursor, limit);
  }
}
