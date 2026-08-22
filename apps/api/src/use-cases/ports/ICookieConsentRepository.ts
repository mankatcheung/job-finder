import type { CookieConsent } from '#src/domain/cookieConsent/CookieConsent.js';

export interface CreateCookieConsentData {
  id: string;
  analyticsAccepted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ICookieConsentRepository {
  create(data: CreateCookieConsentData): Promise<CookieConsent>;
}
