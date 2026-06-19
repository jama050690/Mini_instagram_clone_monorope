import { HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicUser, toPublicUser } from '../users/user.serializer';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { TokensService, TokenPair } from './tokens.service';

interface SessionMeta {
  userAgent?: string;
  ip?: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokensService,
  ) {}

  async register(
    dto: RegisterDto,
    meta: SessionMeta = {},
  ): Promise<AuthResult> {
    await this.ensureUnique(dto.email, dto.username);

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        passwordHash,
      },
    });

    return this.buildResult(user, meta);
  }

  async login(dto: LoginDto, meta: SessionMeta = {}): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Mavjud emas yoki OAuth-only (parolsiz) → bir xil xato (qaysi biri ekanini oshkor qilmaymiz)
    if (!user || !user.passwordHash) {
      throw this.invalidCredentials();
    }

    const ok = await this.passwords.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw this.invalidCredentials();
    }

    this.ensureNotBlocked(user);

    return this.buildResult(user, meta);
  }

  async refresh(
    rawToken: string | undefined,
    meta: SessionMeta = {},
  ): Promise<AuthResult> {
    const { user, tokens } = await this.tokens.rotate(rawToken, meta);
    return { user: toPublicUser(user), tokens };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    await this.tokens.revoke(rawToken);
  }

  private invalidCredentials(): AppException {
    return new AppException(
      HttpStatus.UNAUTHORIZED,
      ErrorCode.INVALID_CREDENTIALS,
      'Email yoki parol noto`g`ri',
    );
  }

  private ensureNotBlocked(user: User): void {
    if (user.isBlocked) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        ErrorCode.USER_BLOCKED,
        'Hisob bloklangan',
      );
    }
  }

  private async ensureUnique(email: string, username: string): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });
    if (!existing) return;
    if (existing.email === email) {
      throw AppException.conflict(
        ErrorCode.EMAIL_TAKEN,
        'Email allaqachon band',
      );
    }
    throw AppException.conflict(
      ErrorCode.USERNAME_TAKEN,
      'Username allaqachon band',
    );
  }

  private async buildResult(
    user: User,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const tokens = await this.tokens.issueTokens(user, meta);
    return { user: toPublicUser(user), tokens };
  }
}
