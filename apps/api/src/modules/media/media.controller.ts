import {
  Controller,
  Get,
  Header,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-codes';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MediaService, type ServableMedia } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Media faylni stream qilish (avtorizatsiya + Range)',
  })
  @Header('Cache-Control', 'private, max-age=86400')
  async serve(
    @Param('id') id: string,
    @CurrentUser('id') viewerId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.media.resolveForViewer(id, viewerId);
    this.stream(req, res, file);
  }

  /** Faylni to'liq (200) yoki Range bo'yicha qisman (206) stream qiladi. */
  private stream(req: Request, res: Response, file: ServableMedia): void {
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Accept-Ranges', 'bytes');

    const range = this.parseRange(req.headers.range, file.sizeBytes);

    if (!range) {
      res.setHeader('Content-Length', file.sizeBytes);
      this.pipe(res, createReadStream(file.absPath));
      return;
    }

    res.status(206);
    res.setHeader(
      'Content-Range',
      `bytes ${range.start}-${range.end}/${file.sizeBytes}`,
    );
    res.setHeader('Content-Length', range.end - range.start + 1);
    this.pipe(
      res,
      createReadStream(file.absPath, { start: range.start, end: range.end }),
    );
  }

  /** `bytes=start-end` ni parse qiladi; noto'g'ri/yo'q bo'lsa null (to'liq fayl). */
  private parseRange(
    header: string | undefined,
    size: number,
  ): { start: number; end: number } | null {
    if (!header?.startsWith('bytes=')) return null;
    const [rawStart, rawEnd] = header.slice(6).split('-');
    const start = rawStart ? Number(rawStart) : 0;
    const end = rawEnd ? Number(rawEnd) : size - 1;
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start > end ||
      end >= size
    ) {
      return null;
    }
    return { start, end };
  }

  private pipe(
    res: Response,
    stream: ReturnType<typeof createReadStream>,
  ): void {
    stream.on('error', () => {
      // Fayl diskda yo'q (yetim DB yozuvi) — 404
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          error: { code: ErrorCode.NOT_FOUND, message: 'Fayl topilmadi' },
        });
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);
  }
}
