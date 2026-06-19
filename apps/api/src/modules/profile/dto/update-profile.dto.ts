import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Username: 3–30 belgi, kichik harf/raqam/`_`/`.` (Instagram uslubi). */
export const USERNAME_REGEX = /^[a-z0-9_.]+$/;

export class UpdateProfileDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 60 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  fullName?: string;

  @ApiPropertyOptional({
    minLength: 3,
    maxLength: 30,
    pattern: USERNAME_REGEX.source,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX, {
    message:
      'username faqat kichik harf, raqam, `_` va `.` dan iborat bo`lishi kerak',
  })
  username?: string;

  @ApiPropertyOptional({
    maxLength: 160,
    description: "Bo'sh string bio'ni tozalaydi",
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;
}
