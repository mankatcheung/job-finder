import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from '#src/constants.js';

describe('buildContainer', () => {
  beforeAll(() => {
    // client.ts constructs the real libSQL client at module-evaluation
    // time, so these must be set before container.js is imported below.
    process.env[ENV.DATABASE_URL] ??= 'file:container-test.db';
    process.env[ENV.JWT_SECRET] ??= 'test-secret';
    process.env[ENV.JWT_REFRESH_SECRET] ??= 'test-refresh-secret';
  });

  it('builds a container whose tokenService resolves to a JwtTokenService', async () => {
    const { buildContainer } = await import('#src/http/container.js');
    const { JwtTokenService } = await import('#src/infrastructure/auth/JwtTokenService.js');

    const container = buildContainer();

    expect(container.resolve('tokenService')).toBeInstanceOf(JwtTokenService);
  }, 15_000);

  it('resolves the offer use cases and resolver through proxy injection', async () => {
    const { buildContainer } = await import('#src/http/container.js');

    const container = buildContainer();

    expect(container.resolve('createOfferUseCase')).toBeDefined();
    expect(container.resolve('updateOfferUseCase')).toBeDefined();
    expect(container.resolve('deleteOfferUseCase')).toBeDefined();
    expect(container.resolve('getOffersUseCase')).toBeDefined();
    expect(container.resolve('compareOffersUseCase')).toBeDefined();
    expect(container.resolve('offerResolver')).toBeDefined();
  });
});
