import {
  Body,
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
import { PostView } from '../posts/post.serializer';
import { CommentView } from './comment.serializer';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EngagementService } from './engagement.service';

@ApiTags('engagement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Post('posts/:id/like')
  @HttpCode(200)
  @ApiOperation({ summary: 'Like bosish (idempotent)' })
  like(@Param('id') id: string, @CurrentUser() user: User): Promise<PostView> {
    return this.engagement.like(id, user);
  }

  @Delete('posts/:id/like')
  @HttpCode(200)
  @ApiOperation({ summary: 'Like olib tashlash (idempotent)' })
  unlike(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<PostView> {
    return this.engagement.unlike(id, user);
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Izoh qo`shish' })
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentView> {
    return this.engagement.addComment(id, user, dto.text);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Izohlar ro`yxati (cursor pagination)' })
  listComments(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<Page<CommentView>> {
    return this.engagement.listComments(id, user, cursor, limit);
  }

  @Delete('comments/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Izohni o`chirish (egasi/post egasi/admin)' })
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.engagement.deleteComment(id, user);
  }
}
