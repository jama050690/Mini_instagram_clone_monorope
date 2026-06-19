import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { CAPTION_MAX_LENGTH } from './create-post.dto';

/**
 * `PATCH /posts/:id` — faqat caption matnini o'zgartiradi (media o'zgarmaydi).
 * Bo'sh string caption'ni tozalaydi.
 */
export class UpdatePostDto {
  @ApiProperty({ maxLength: CAPTION_MAX_LENGTH })
  @IsString()
  @MaxLength(CAPTION_MAX_LENGTH)
  caption!: string;
}
