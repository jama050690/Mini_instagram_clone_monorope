import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Env } from '../../../config/env.validation';
import { GoogleProfile } from '../google-auth.service';

/**
 * Google OAuth2 strategiyasi. Faqat GOOGLE_CLIENT_ID sozlangan bo'lsa
 * ro'yxatdan o'tadi (AuthModule'dagi conditional provider).
 * validate() Google profilini bizning GoogleProfile shakliga keltiradi —
 * qaror (ulash/onboarding) controller'da signIn() orqali.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService<Env, true>) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID', { infer: true }),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET', { infer: true }),
      callbackURL: config.get('GOOGLE_CALLBACK_URL', { infer: true }),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const mapped: GoogleProfile = {
      googleId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      fullName: profile.displayName || profile.username || 'Google User',
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, mapped);
  }
}
