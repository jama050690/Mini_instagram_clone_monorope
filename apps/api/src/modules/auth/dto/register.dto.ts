import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'aziz@example.com' })
  @IsEmail({}, { message: 'Email noto`g`ri formatda' })
  email!: string;

  @ApiProperty({ example: 'parol1234', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 belgi bo`lishi kerak' })
  @MaxLength(72, { message: 'Parol juda uzun' })
  password!: string;

  @ApiProperty({ example: 'aziz', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Username faqat harf, raqam, nuqta va pastki chiziqdan iborat',
  })
  username!: string;

  @ApiProperty({ example: 'Aziz Karimov' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fullName!: string;
}
