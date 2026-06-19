import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'aziz@example.com' })
  @IsEmail({}, { message: 'Email noto`g`ri formatda' })
  email!: string;

  @ApiProperty({ example: 'parol1234' })
  @IsString()
  @MinLength(1)
  password!: string;
}
