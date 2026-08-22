import type { IRecordCookieConsentUseCase } from '#src/use-cases/cookieConsent/IRecordCookieConsentUseCase.js';
import type { DeviceInfo } from '#src/interface-adapters/resolvers/AuthResolver.js';

interface Deps {
  recordCookieConsentUseCase: IRecordCookieConsentUseCase;
}

export class CookieConsentResolver {
  constructor(private readonly deps: Deps) {}

  async recordCookieConsent(analyticsAccepted: boolean, device: DeviceInfo): Promise<boolean> {
    await this.deps.recordCookieConsentUseCase.execute({
      analyticsAccepted,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
    return true;
  }
}
