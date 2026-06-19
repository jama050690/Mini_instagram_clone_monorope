import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Env } from '../../config/env.validation';
import { PublicUser, toPublicUser } from '../users/user.serializer';
import { AuthResult, AuthService } from './auth.service';
import { GoogleCompleteDto } from './dto/google-complete.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthService, GoogleProfile } from './google-auth.service';
import {
  clearRefreshCookie,
  REFRESH_COOKIE,
  setRefreshCookie,
} from './refresh-cookie';

interface AuthBody {
  user: PublicUser;
  accessToken: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleAuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Email/parol bilan ro`yxatdan o`tish' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthBody> {
    const result = await this.auth.register(dto, this.meta(req));
    return this.respond(result, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email/parol bilan kirish' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthBody> {
    const result = await this.auth.login(dto, this.meta(req));
    return this.respond(result, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access tokenni yangilash (refresh rotatsiya)' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthBody> {
    const raw = this.refreshFromCookie(req);
    const result = await this.auth.refresh(raw, this.meta(req));
    return this.respond(result, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy sessiyani tugatish' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ loggedOut: true }> {
    await this.auth.logout(this.refreshFromCookie(req));
    clearRefreshCookie(res, this.config.get('COOKIE_SECURE', { infer: true }));
    return { loggedOut: true };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth boshlanishi (redirect)' })
  googleStart(): void {
    // AuthGuard('google') Google'ga redirect qiladi — tana ishlamaydi
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google callback — kirish yoki onboarding' })
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const profile = req.user as GoogleProfile;
    const outcome = await this.google.signIn(profile, this.meta(req));
    const redirect = this.config.get('WEB_AUTH_REDIRECT', { infer: true });

    if (outcome.kind === 'authenticated') {
      this.respond(outcome.result, res);
      res.redirect(
        `${redirect}?accessToken=${encodeURIComponent(outcome.result.tokens.accessToken)}`,
      );
      return;
    }
    res.redirect(
      `${redirect}?onboarding=1&registrationToken=${encodeURIComponent(outcome.registrationToken)}`,
    );
  }

  @Post('google/complete')
  @ApiOperation({
    summary: 'Google onboarding: username tanlab user yaratish',
  })
  async googleComplete(
    @Body() dto: GoogleCompleteDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthBody> {
    const result = await this.google.completeOnboarding(dto, this.meta(req));
    return this.respond(result, res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi profili' })
  me(@CurrentUser() user: User): PublicUser {
    return toPublicUser(user);
  }

  private refreshFromCookie(req: Request): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[
      REFRESH_COOKIE
    ];
  }

  private meta(req: Request): { userAgent?: string; ip?: string } {
    return { userAgent: req.headers['user-agent'], ip: req.ip };
  }

  /** Refresh cookie'ni o'rnatadi va body uchun user+accessToken qaytaradi. */
  private respond(result: AuthResult, res: Response): AuthBody {
    setRefreshCookie(res, result.tokens.refreshToken, {
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      maxAgeSec: this.config.get('JWT_REFRESH_TTL', { infer: true }),
    });
    return { user: result.user, accessToken: result.tokens.accessToken };
  }
}
