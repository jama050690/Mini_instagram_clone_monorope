import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Caption uzunligi cheklovi (SRS 4.4). */
export const CAPTION_MAX_LENGTH = 2200;

/**
 * `POST /posts` matn qismi (fayllar `files[]` orqali multipart keladi).
 * Caption ixtiyoriy — captionsiz post ham mumkin.
 */
export class CreatePostDto {
  @ApiPropertyOptional({ maxLength: CAPTION_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(CAPTION_MAX_LENGTH)
  caption?: string;
}
