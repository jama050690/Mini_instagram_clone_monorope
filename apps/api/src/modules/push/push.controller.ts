import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PushService } from './push.service';

class SubscribeDto {
  endpoint!: string;
  p256dh!: string;
  auth!: string;
}

@ApiTags('push')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private readonly svc: PushService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'VAPID public key (frontend uchun)' })
  vapidKey() {
    return { key: this.svc.getPublicKey() };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Push subscription saqlash' })
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() body: SubscribeDto,
  ) {
    await this.svc.subscribe(userId, body.endpoint, body.p256dh, body.auth);
    return { success: true };
  }

  @Delete('subscribe')
  @ApiOperation({ summary: 'Push subscription o\'chirish' })
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.svc.unsubscribe(body.endpoint);
    return { success: true };
  }
}
