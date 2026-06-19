import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Himoyalangan endpointlar uchun. JwtStrategy'ni ishga soladi.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
