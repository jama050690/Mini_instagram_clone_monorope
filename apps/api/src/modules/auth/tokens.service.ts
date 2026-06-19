import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { sha256 } from '../../common/utils/hash.util';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';

export interface AccessPayload {
  sub: string;
  role: User['role'];
}

export interface RefreshPayload {
  sub: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

/**
 * JWT access + refresh tokenlarini berish va refresh'ni DB'da (xeshlangan)
 * saqlash. Rotatsiya/bekor qilish logikasi shu yerda markazlashgan (deep module).
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  /** Yangi access+refresh juftligi beradi va refresh'ni DB'ga yozadi. */
  async issueTokens(user: User, meta: SessionMeta = {}): Promise<TokenPair> {
    const accessToken = await this.signAccess(user);
    const jti = randomUUID();
    const refreshToken = await this.signRefresh(user, jti);

    const ttl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + ttl * 1000),
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh tokenni rotatsiya qiladi: tekshiradi → reuse aniqlaydi → eskisini
   * bekor qiladi → yangi juftlik beradi. Reuse (bekor qilingan token qayta
   * ishlatilsa) → userning **barcha** sessiyalari bekor qilinadi.
   */
  async rotate(
    rawToken: string | undefined,
    meta: SessionMeta = {},
  ): Promise<{ user: User; tokens: TokenPair }> {
    const payload = await this.verifyRefresh(rawToken);

    const row = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    if (!row) throw AppException.unauthorized('Token yaroqsiz');

    // Reuse detection: bekor qilingan token qayta ishlatildi
    if (row.revokedAt) {
      await this.revokeAllForUser(row.userId);
      throw AppException.unauthorized(
        'Token qayta ishlatildi — sessiyalar bekor qilindi',
      );
    }

    if (row.tokenHash !== sha256(rawToken!) || row.expiresAt < new Date()) {
      throw AppException.unauthorized('Token yaroqsiz');
    }

    // Joriy tokenni bekor qilamiz (rotatsiya)
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
    });
    if (!user) throw AppException.unauthorized('Token yaroqsiz');
    if (user.isBlocked) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.USER_BLOCKED,
        'Hisob bloklangan',
      );
    }

    const tokens = await this.issueTokens(user, meta);
    return { user, tokens };
  }

  /** Logout: berilgan refresh tokenni bekor qiladi (yaroqsiz bo'lsa jim o'tadi). */
  async revoke(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    let payload: RefreshPayload;
    try {
      payload = await this.verifyRefreshUnsafe(rawToken);
    } catch {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async verifyRefresh(
    rawToken: string | undefined,
  ): Promise<RefreshPayload> {
    if (!rawToken) throw AppException.unauthorized('Refresh token yo`q');
    try {
      return await this.verifyRefreshUnsafe(rawToken);
    } catch {
      throw AppException.unauthorized('Token yaroqsiz');
    }
  }

  private verifyRefreshUnsafe(rawToken: string): Promise<RefreshPayload> {
    return this.jwt.verifyAsync<RefreshPayload>(rawToken, {
      secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
    });
  }

  private signAccess(user: User): Promise<string> {
    const payload: AccessPayload = { sub: user.id, role: user.role };
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
    });
  }

  private signRefresh(user: User, jti: string): Promise<string> {
    const payload: RefreshPayload = { sub: user.id, jti };
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_REFRESH_TTL', { infer: true }),
    });
  }
}
