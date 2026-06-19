import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, User } from '@prisma/client';
import { AppException } from '../exceptions/app.exception';
import { RolesGuard } from './roles.guard';

function contextWith(user: User | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardWith(required: Role[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

const adminUser = { role: Role.ADMIN } as User;
const normalUser = { role: Role.USER } as User;

describe('RolesGuard', () => {
  it('rol talab qilinmasa → o`tkazadi', () => {
    expect(guardWith(undefined).canActivate(contextWith(normalUser))).toBe(
      true,
    );
  });

  it('mos rol (ADMIN) → o`tkazadi', () => {
    expect(guardWith([Role.ADMIN]).canActivate(contextWith(adminUser))).toBe(
      true,
    );
  });

  it('mos kelmagan rol → 403', () => {
    expect(() =>
      guardWith([Role.ADMIN]).canActivate(contextWith(normalUser)),
    ).toThrow(AppException);
  });

  it('user yo`q → 403', () => {
    expect(() =>
      guardWith([Role.ADMIN]).canActivate(contextWith(undefined)),
    ).toThrow(AppException);
  });
});
