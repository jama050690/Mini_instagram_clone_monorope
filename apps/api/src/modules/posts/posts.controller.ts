import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Page } from '../../common/utils/pagination';
import { POST_VIDEO_MAX_BYTES } from '../media/media.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostView } from './post.serializer';
import { PostsService } from './posts.service';

/** Multipart cheklovi: max 10 fayl, har biri ≤20MB (eng katta video chegarasi). */
const MAX_FILES = 10;

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Post('posts')
  @ApiOperation({ summary: 'Post yaratish (multipart: caption?, files[])' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        caption: { type: 'string' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: POST_VIDEO_MAX_BYTES },
    }),
  )
  create(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<PostView> {
    return this.posts.create(user, dto.caption, files ?? []);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Bitta post (maxfiylik)' })
  getOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<PostView> {
    return this.posts.getById(id, user);
  }

  @Get('users/:username/posts')
  @ApiOperation({ summary: 'Profil grid (maxfiylik, cursor pagination)' })
  byAuthor(
    @Param('username') username: string,
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<Page<PostView>> {
    return this.posts.listByAuthor(username, user, cursor, limit);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: 'Caption tahrirlash (egasi)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePostDto,
  ): Promise<PostView> {
    return this.posts.updateCaption(id, user, dto.caption);
  }

  @Delete('posts/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Post o`chirish (soft, egasi/admin)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    await this.posts.remove(id, user);
  }
}
