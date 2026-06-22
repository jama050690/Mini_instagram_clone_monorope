import * as fs from 'fs';
import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Media stream (avtorizatsiya + disk)' })
  @Header('Cache-Control', 'private, max-age=86400')
  async serve(
    @Param('id') id: string,
    @CurrentUser('id') viewerId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.media.resolveForViewer(id, viewerId);

    if (!fs.existsSync(file.absPath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    res.setHeader('Content-Type', file.mimeType);
    fs.createReadStream(file.absPath).pipe(res);
  }
}
