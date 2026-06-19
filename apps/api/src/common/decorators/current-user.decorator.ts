import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';

/**
 * Joriy (autentifikatsiyalangan) foydalanuvchini oladi — JwtStrategy `req.user`
 * ga yozgan User entity. Faqat JwtAuthGuard bilan himoyalangan route'larda.
 *
 *   @CurrentUser() user: User
 *   @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user: User }>();
    return data ? req.user?.[data] : req.user;
  },
);
