import { Injectable } from '@nestjs/common';
import { FollowStatus, Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { PublicUser, toPublicUser } from '../users/user.serializer';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  /** Profil maydonlarini (fullName/username/bio) qisman yangilaydi. */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...(dto.username !== undefined ? { username: dto.username } : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        },
      });
      return toPublicUser(user);
    } catch (e) {
      // Unique buzilishi (username band) → 409
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw AppException.conflict(
          ErrorCode.USERNAME_TAKEN,
          'Bu username band',
        );
      }
      throw e;
    }
  }

  /**
   * Maxfiylik rejimini o'zgartiradi. Private→Public o'tilganda barcha PENDING
   * follow so'rovlari avtomatik ACCEPTED bo'ladi (bitta tranzaksiyada).
   */
  async setPrivacy(userId: string, isPrivate: boolean): Promise<PublicUser> {
    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isPrivate },
      });
      if (!isPrivate) {
        await tx.follow.updateMany({
          where: { followingId: userId, status: FollowStatus.PENDING },
          data: { status: FollowStatus.ACCEPTED },
        });
      }
      return updated;
    });
    return toPublicUser(user);
  }

  /** Avatar yuklaydi (validate + saqlash) va `avatarUrl`ni yangilaydi. */
  async setAvatar(
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<PublicUser> {
    if (!file) {
      throw AppException.badRequest('`avatar` fayli talab qilinadi');
    }
    const avatarUrl = await this.media.storeAvatar(userId, file);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return toPublicUser(user);
  }

  /** Avatarni o'chiradi (fayl + `avatarUrl=null`). */
  async removeAvatar(userId: string): Promise<PublicUser> {
    await this.media.deleteAvatar(userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    return toPublicUser(user);
  }
}
