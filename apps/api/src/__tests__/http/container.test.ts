import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from '@/constants.js';

describe('buildContainer', () => {
  beforeAll(() => {
    // client.ts constructs the real Prisma/libSQL client at module-evaluation
    // time, so these must be set before container.js is imported below.
    process.env[ENV.DATABASE_URL] ??= 'file:container-test.db';
    process.env[ENV.JWT_SECRET] ??= 'test-secret';
    process.env[ENV.JWT_REFRESH_SECRET] ??= 'test-refresh-secret';
  });

  it('builds a container whose tokenService resolves to a JwtTokenService', async () => {
    const { buildContainer } = await import('@/http/container.js');
    const { JwtTokenService } = await import('@/infrastructure/auth/JwtTokenService.js');

    const container = buildContainer();

    expect(container.resolve('tokenService')).toBeInstanceOf(JwtTokenService);
  });
});
