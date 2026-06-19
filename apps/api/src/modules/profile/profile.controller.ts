import {
  Body,
  Controller,
  Delete,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PublicUser } from '../users/user.serializer';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

/** Multer xotira buferi uchun qattiq tom chegara (validateImage 2MB ni qo'llaydi). */
const MULTER_MAX_BYTES = 5 * 1024 * 1024;

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Patch()
  @ApiOperation({ summary: 'Profilni tahrirlash (fullName/username/bio)' })
  update(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    return this.profile.updateProfile(userId, dto);
  }

  @Patch('privacy')
  @ApiOperation({ summary: 'Maxfiylik rejimi (Public/Private)' })
  setPrivacy(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePrivacyDto,
  ): Promise<PublicUser> {
    return this.profile.setPrivacy(userId, dto.isPrivate);
  }

  @Post('avatar')
  @ApiOperation({
    summary: 'Avatar yuklash (multipart, max 2MB, jpg/png/webp)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: MULTER_MAX_BYTES },
    }),
  )
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PublicUser> {
    return this.profile.setAvatar(userId, file);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Avatarni o`chirish' })
  deleteAvatar(@CurrentUser('id') userId: string): Promise<PublicUser> {
    return this.profile.removeAvatar(userId);
  }
}
