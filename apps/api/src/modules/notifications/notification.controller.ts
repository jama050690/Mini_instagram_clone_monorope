import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly svc: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Bildirishnomalar ro\'yxati (cursor)' })
  async list(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.list(userId, cursor, limit ? +limit : 20);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'O\'qilmagan bildirishnomalar soni' })
  async unreadCount(@CurrentUser('id') userId: string) {
    const count = await this.svc.unreadCount(userId);
    return { count };
  }

  @Patch('read')
  @ApiOperation({ summary: 'Barchasini o\'qilgan deb belgilash' })
  async markRead(@CurrentUser('id') userId: string) {
    await this.svc.markAllRead(userId);
    return { success: true };
  }
}
