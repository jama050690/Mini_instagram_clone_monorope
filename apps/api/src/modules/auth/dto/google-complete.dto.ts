import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class GoogleCompleteDto {
  @ApiProperty({ description: 'Google callback bergan onboarding tokeni' })
  @IsString()
  registrationToken!: string;

  @ApiProperty({ example: 'googler', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Username faqat harf, raqam, nuqta va pastki chiziqdan iborat',
  })
  username!: string;
}
