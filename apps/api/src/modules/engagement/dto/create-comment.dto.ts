import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Izoh uzunligi cheklovi (SRS 4.5). */
export const COMMENT_MAX_LENGTH = 1000;

export class CreateCommentDto {
  @ApiProperty({ minLength: 1, maxLength: COMMENT_MAX_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMENT_MAX_LENGTH)
  text!: string;
}
