import {
  Controller,
  Get,
  Header,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { get as httpGet } from 'http';
import { get as httpsGet } from 'https';
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
  @ApiOperation({ summary: 'Media proxy (avtorizatsiya + Cloudinary stream)' })
  @Header('Cache-Control', 'private, max-age=86400')
  async serve(
    @Param('id') id: string,
    @CurrentUser('id') viewerId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.media.resolveForViewer(id, viewerId);

    res.setHeader('Content-Type', file.mimeType);

    const getter = file.url.startsWith('https') ? httpsGet : httpGet;
    getter(file.url, (upstream) => {
      upstream.pipe(res);
    }).on('error', () => {
      if (!res.headersSent) {
        res
          .status(404)
          .json({ success: false, error: { message: 'Fayl topilmadi' } });
      }
    });
  }
}
