import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';

/**
 * EU27 + EEA (Iceland, Liechtenstein, Norway) + UK (retains UK GDPR
 * post-Brexit) + Switzerland (its own, similar consent law) — the set of
 * jurisdictions where a cookie banner needs to gate non-essential cookies
 * behind opt-in rather than just disclosing them (JEF-211).
 */
const CONSENT_REQUIRED_COUNTRIES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE', // EU27
  'IS',
  'LI',
  'NO', // EEA
  'GB', // UK GDPR
  'CH', // Switzerland
]);

/** Primary language subtags of the above, as a weaker fallback signal. */
const CONSENT_REQUIRED_LANGUAGES = new Set([
  'de',
  'fr',
  'it',
  'es',
  'nl',
  'pl',
  'sv',
  'da',
  'fi',
  'el',
  'cs',
  'hu',
  'pt',
  'ro',
  'bg',
  'hr',
  'sk',
  'sl',
  'et',
  'lv',
  'lt',
  'mt',
  'ga',
  'is',
  'nb',
  'nn',
  'no',
]);

function acceptLanguageSuggestsConsentRequired(acceptLanguage: string | undefined): boolean {
  if (!acceptLanguage) return false;
  // "en-US,en;q=0.9,de;q=0.8" -> ["en-us", "en", "de"] -> primary subtags
  const primaryTags = acceptLanguage
    .split(',')
    .map((entry) => entry.split(';')[0]?.trim().split('-')[0]?.toLowerCase())
    .filter((tag): tag is string => Boolean(tag));
  // Only the first (most-preferred) language is a meaningful signal — a
  // browser listing German as a lower-priority fallback after English
  // doesn't mean the visitor is in Germany.
  return primaryTags.length > 0 && CONSENT_REQUIRED_LANGUAGES.has(primaryTags[0]);
}

/**
 * Whether the current visitor needs to opt in before non-essential cookies
 * load, rather than having them on by default. Vercel injects
 * `x-vercel-ip-country` on every request in production — no external
 * lookup, no added latency — which `Accept-Language` (present on every
 * request everywhere, including local dev) backs up when that header is
 * absent.
 */
export const getRequiresCookieConsent = createServerFn({ method: 'GET' }).handler(async () => {
  const country = getRequestHeader('x-vercel-ip-country');
  if (country) return CONSENT_REQUIRED_COUNTRIES.has(country.toUpperCase());
  return acceptLanguageSuggestsConsentRequired(getRequestHeader('accept-language'));
});
