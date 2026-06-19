import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Env } from '../../config/env.validation';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { PasswordService } from './password.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensService } from './tokens.service';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    PasswordService,
    TokensService,
    JwtStrategy,
    // GoogleStrategy faqat GOOGLE_CLIENT_ID sozlangan bo'lsa ro'yxatdan o'tadi
    {
      provide: GoogleStrategy,
      useFactory: (config: ConfigService<Env, true>) =>
        config.get('GOOGLE_CLIENT_ID', { infer: true })
          ? new GoogleStrategy(config)
          : null,
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, TokensService],
})
export class AuthModule {}
