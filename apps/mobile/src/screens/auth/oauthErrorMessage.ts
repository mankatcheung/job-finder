/**
 * Turns the `oauthError` slug the API's callback hands back through the
 * trakwyn://oauth-callback deep link into copy — mirrors apps/web's
 * oauthError.ts, without the i18n machinery this app doesn't have yet.
 *
 * The API sends a value from a closed set and never a free-text message
 * (JEF-203), so an unrecognised slug falls back to the generic line rather
 * than being printed directly.
 */
const SLUG_MESSAGES: Record<string, string> = {
  access_denied: 'You cancelled the sign-in, so nothing was changed.',
  missing_code: "Sign-in didn't work. Please try again.",
  invalid_state: 'That sign-in link has expired or was not started here. Please try again.',
  provider_mismatch: 'That sign-in link has expired or was not started here. Please try again.',
  email_in_use:
    'An account with this email already exists. Sign in with your password, then link this provider from Settings.',
  email_not_verified:
    'Your provider did not share a verified email address, so an account could not be created.',
  account_not_found: 'That linked account no longer exists.',
  failed: "Sign-in didn't work. Please try again.",
};

export function oauthErrorMessage(slug: string): string {
  return SLUG_MESSAGES[slug] ?? SLUG_MESSAGES.failed!;
}
