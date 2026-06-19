import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Page } from '../../common/utils/pagination';
import { PostView } from '../posts/post.serializer';
import { AdminStats, AdminUserDetail, AdminUserView } from './admin.serializer';
import { AdminService } from './admin.service';
import { ListUsersDto } from './dto/list-users.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard statistikasi' })
  stats(): Promise<AdminStats> {
    return this.admin.stats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Foydalanuvchilar ro`yxati (qidiruv, cursor)' })
  listUsers(@Query() dto: ListUsersDto): Promise<Page<AdminUserView>> {
    return this.admin.listUsers(dto.search, dto.cursor, dto.limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Bitta user (counts bilan)' })
  getUser(@Param('id') id: string): Promise<AdminUserDetail> {
    return this.admin.getUser(id);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: 'Foydalanuvchini bloklash' })
  block(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ): Promise<AdminUserView> {
    return this.admin.blockUser(adminId, id);
  }

  @Patch('users/:id/unblock')
  @ApiOperation({ summary: 'Blokdan chiqarish' })
  unblock(@Param('id') id: string): Promise<AdminUserView> {
    return this.admin.unblockUser(id);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Postlar ro`yxati (moderatsiya)' })
  listPosts(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<Page<PostView>> {
    return this.admin.listPosts(cursor, limit);
  }

  @Delete('posts/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Postni o`chirish (soft + fayllar)' })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ): Promise<void> {
    await this.admin.deletePost(admin, id);
  }

  @Delete('comments/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Izohni o`chirish' })
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() admin: User,
  ): Promise<void> {
    await this.admin.deleteComment(admin, id);
  }
}
