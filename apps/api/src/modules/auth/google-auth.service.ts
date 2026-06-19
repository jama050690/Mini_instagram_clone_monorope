import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';
import { toPublicUser } from '../users/user.serializer';
import { AuthResult } from './auth.service';
import { GoogleCompleteDto } from './dto/google-complete.dto';
import { TokensService } from './tokens.service';

/** Google'dan keladigan profil ma'lumoti (faqat kerakli maydonlar). */
export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

const ONBOARDING_PURPOSE = 'google_onboarding';

interface OnboardingClaims extends GoogleProfile {
  purpose: typeof ONBOARDING_PURPOSE;
}

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

export type GoogleSignInResult =
  | { kind: 'authenticated'; result: AuthResult }
  | { kind: 'onboarding'; registrationToken: string };

/**
 * Google OAuth biznes logikasi (passport strategiyasidan ajratilgan, testlanadigan):
 * mavjud user'ni ulash yoki yangi user uchun onboarding tokeni berish.
 */
@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly tokens: TokensService,
  ) {}

  /**
   * Google profil bilan kirish. Mavjud user (googleId yoki email mos) → ulanadi
   * va tokenlar beriladi. Yangi user → onboarding tokeni qaytariladi.
   */
  async signIn(
    profile: GoogleProfile,
    meta: SessionMeta = {},
  ): Promise<GoogleSignInResult> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
    });

    if (!user) {
      return {
        kind: 'onboarding',
        registrationToken: await this.buildRegistrationToken(profile),
      };
    }

    if (user.isBlocked) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.USER_BLOCKED,
        'Hisob bloklangan',
      );
    }

    // googleId yo'q bo'lsa — akkauntga ulaymiz (link)
    const linked = user.googleId
      ? user
      : await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId },
        });

    const tokens = await this.tokens.issueTokens(linked, meta);
    return {
      kind: 'authenticated',
      result: { user: toPublicUser(linked), tokens },
    };
  }

  /** Onboarding (registration) tokeni — qisqa muddatli JWT, Google profilini tashiydi. */
  buildRegistrationToken(profile: GoogleProfile): Promise<string> {
    const claims: OnboardingClaims = {
      ...profile,
      purpose: ONBOARDING_PURPOSE,
    };
    return this.jwt.signAsync(claims, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('GOOGLE_ONBOARDING_TTL', { infer: true }),
    });
  }

  /** Onboarding: registrationToken + username → user yaratiladi, tokenlar beriladi. */
  async completeOnboarding(
    dto: GoogleCompleteDto,
    meta: SessionMeta = {},
  ): Promise<AuthResult> {
    const claims = await this.verifyOnboarding(dto.registrationToken);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: claims.email }, { username: dto.username }] },
      select: { email: true, username: true },
    });
    if (existing?.email === claims.email) {
      throw AppException.conflict(
        ErrorCode.EMAIL_TAKEN,
        'Email allaqachon band',
      );
    }
    if (existing?.username === dto.username) {
      throw AppException.conflict(
        ErrorCode.USERNAME_TAKEN,
        'Username allaqachon band',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        email: claims.email,
        username: dto.username,
        fullName: claims.fullName,
        avatarUrl: claims.avatarUrl,
        googleId: claims.googleId,
        passwordHash: null,
      },
    });

    const tokens = await this.tokens.issueTokens(user, meta);
    return { user: toPublicUser(user), tokens };
  }

  private async verifyOnboarding(token: string): Promise<OnboardingClaims> {
    let claims: OnboardingClaims;
    try {
      claims = await this.jwt.verifyAsync<OnboardingClaims>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
    } catch {
      throw AppException.unauthorized('Onboarding tokeni yaroqsiz');
    }
    if (claims.purpose !== ONBOARDING_PURPOSE) {
      throw AppException.unauthorized('Onboarding tokeni yaroqsiz');
    }
    return claims;
  }
}
