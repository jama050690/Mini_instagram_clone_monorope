import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const valid = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db?schema=public',
    JWT_ACCESS_SECRET: 'access-secret-at-least-16',
    JWT_REFRESH_SECRET: 'refresh-secret-at-least-16',
  };

  it('to`g`ri env uchun default qiymatlarni qo`yadi', () => {
    const env = validateEnv(valid);
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.CORS_ORIGIN).toBe('http://localhost:5173');
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.JWT_ACCESS_TTL).toBe(900);
    expect(env.COOKIE_SECURE).toBe(false);
  });

  it('PORT ni string`dan number`ga coerce qiladi', () => {
    const env = validateEnv({ ...valid, PORT: '4000' });
    expect(env.PORT).toBe(4000);
  });

  it('DATABASE_URL yetishmasa throw qiladi', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('noto`g`ri NODE_ENV uchun throw qiladi', () => {
    expect(() => validateEnv({ ...valid, NODE_ENV: 'staging' })).toThrow(
      /Env validatsiyasi/,
    );
  });
});
