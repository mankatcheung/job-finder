import { describe, it, expect, vi } from 'vitest';
import { CookieConsentResolver } from '#src/interface-adapters/resolvers/CookieConsentResolver.js';
import type { IRecordCookieConsentUseCase } from '#src/use-cases/cookieConsent/IRecordCookieConsentUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  recordCookieConsentUseCase: stub<IRecordCookieConsentUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  ...overrides,
});

describe('CookieConsentResolver', () => {
  it('recordCookieConsent: delegates to the use case with the device info and returns true', async () => {
    const deps = makeDeps();
    const resolver = new CookieConsentResolver(deps);

    const result = await resolver.recordCookieConsent(true, {
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0',
    });

    expect(deps.recordCookieConsentUseCase.execute).toHaveBeenCalledWith({
      analyticsAccepted: true,
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0',
    });
    expect(result).toBe(true);
  });

  it('recordCookieConsent: passes a rejection through unchanged', async () => {
    const deps = makeDeps();
    const resolver = new CookieConsentResolver(deps);

    await resolver.recordCookieConsent(false, { ipAddress: null, userAgent: null });

    expect(deps.recordCookieConsentUseCase.execute).toHaveBeenCalledWith({
      analyticsAccepted: false,
      ipAddress: null,
      userAgent: null,
    });
  });
});
