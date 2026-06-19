import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdatePrivacyDto {
  @ApiProperty({ description: 'true → private (postlar faqat obunachilarga)' })
  @IsBoolean()
  isPrivate!: boolean;
}
