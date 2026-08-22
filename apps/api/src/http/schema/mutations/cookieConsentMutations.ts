import { builder } from '#src/http/schema/builder.js';
import { fromCodedError } from '#src/http/errors/AppError.js';
import { deviceInfoFrom } from '#src/http/schema/requestDeviceInfo.js';

/**
 * Deliberately unauthenticated (no `ctx.user` check) — a cookie-consent
 * decision is made before/without an account existing, from the landing
 * page or login/register (JEF-211). Best-effort audit trail, not something
 * the caller needs to see fail: `CookieConsent.tsx` fires this after already
 * updating localStorage, which is what actually gates rendering.
 */
builder.mutationField('recordCookieConsent', (t) =>
  t.boolean({
    args: {
      analyticsAccepted: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { cookieConsentResolver } = ctx.diScope.cradle;
      try {
        return await cookieConsentResolver.recordCookieConsent(
          args.analyticsAccepted,
          deviceInfoFrom(ctx.request),
        );
      } catch (err) {
        throw fromCodedError(err);
      }
    },
  }),
);
