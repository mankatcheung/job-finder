/**
 * A single visitor's cookie-consent decision, for audit purposes (JEF-211).
 * Anonymous by design — recorded before/without a Trakwyn account existing,
 * so there is no `userId` to attach it to. "Necessary" cookies are implicit
 * and non-optional; `analyticsAccepted` is the only category currently
 * offered, matching the one non-essential thing the app actually loads
 * (`@vercel/analytics`).
 */
export type CookieConsent = {
  id: string;
  analyticsAccepted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  consentedAt: Date;
};
