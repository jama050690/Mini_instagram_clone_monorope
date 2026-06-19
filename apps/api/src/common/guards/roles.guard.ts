import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, User } from '@prisma/client';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppException } from '../exceptions/app.exception';

/**
 * `@Roles(...)` metadata'sini tekshiradi. JwtAuthGuard'dan keyin ishlaydi —
 * `req.user` mavjud bo'lishi shart. Rol mos kelmasa → 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = req.user;
    if (!user || !required.includes(user.role)) {
      throw AppException.forbidden('Bu amal uchun ruxsat yo`q');
    }
    return true;
  }
}
