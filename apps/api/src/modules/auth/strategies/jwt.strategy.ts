import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCode } from '../../../common/errors/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';
import { Env } from '../../../config/env.validation';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessPayload } from '../tokens.service';

/**
 * Access tokenni tekshiradi: Bearer → verify → DB'dan user yuklaydi.
 * Bloklangan user himoyalangan endpointga kira olmaydi (403 USER_BLOCKED).
 * validate() qaytargan qiymat `req.user` ga yoziladi.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  async validate(payload: AccessPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }
    if (user.isBlocked) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.USER_BLOCKED,
        'Hisob bloklangan',
      );
    }
    return user;
  }
}
