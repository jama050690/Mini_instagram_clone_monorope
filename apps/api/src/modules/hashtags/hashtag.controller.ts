import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HashtagService } from './hashtag.service';

@ApiTags('hashtags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hashtags')
export class HashtagController {
  constructor(private readonly hashtags: HashtagService) {}

  @Get(':tag/posts')
  @ApiOperation({ summary: 'Hashtagga tegishli postlar (cursor pagination)' })
  async listByTag(
    @Param('tag') tag: string,
    @CurrentUser() viewer: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.hashtags.listByTag(tag, viewer, cursor, limit ? +limit : undefined);
    return { success: true, data: result };
  }
}
