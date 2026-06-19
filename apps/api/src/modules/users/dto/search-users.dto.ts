import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { MAX_LIMIT } from '../../../common/utils/pagination';

export class SearchUsersDto {
  @ApiPropertyOptional({ description: 'Qidiruv matni (username/fullName)' })
  @IsString()
  @MinLength(1, { message: 'q bo`sh bo`lmasligi kerak' })
  q!: string;

  @ApiPropertyOptional({ description: 'Oldingi sahifaning nextCursor qiymati' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: `Sahifa hajmi (max ${MAX_LIMIT})` })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;
}
