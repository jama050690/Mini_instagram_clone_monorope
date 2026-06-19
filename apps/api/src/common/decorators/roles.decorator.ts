import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Endpoint(lar)ni ma'lum rol(lar) bilan cheklaydi. `RolesGuard` bilan birga
 * ishlaydi (JwtAuthGuard'dan keyin):
 *
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.ADMIN)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
