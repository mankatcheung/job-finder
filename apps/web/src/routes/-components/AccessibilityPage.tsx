import { LegalPageLayout } from '#/components/LegalPageLayout';

const LAST_UPDATED = 'August 23, 2026';
const CONTACT_EMAIL = 'privacy@trakwyn.com';

/**
 * Not a compliance claim — Trakwyn hasn't had a full manual accessibility
 * audit. This states what's actually true today: a target standard, and
 * what's actually been done toward it, per JEF-132.
 */
export function AccessibilityPage() {
  return (
    <LegalPageLayout title="Accessibility" lastUpdated={LAST_UPDATED}>
      <p>
        We want Trakwyn to be usable by everyone, including people using assistive technology like
        screen readers, keyboard-only navigation, or browser zoom.
      </p>

      <h2>Our target</h2>
      <p>
        We’re working toward the{' '}
        <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noreferrer">
          Web Content Accessibility Guidelines (WCAG) 2.1
        </a>{' '}
        at Level AA. This is a target we’re working toward, not a certification — Trakwyn hasn’t had
        a full manual accessibility audit, so we can’t claim to have fully met it yet.
      </p>

      <h2>What we’ve done</h2>
      <ul>
        <li>
          Automated accessibility scans (axe-core) run in our test suite against key pages,
          including sign-in, registration, the dashboard, and the applications list, and are
          required to pass with zero violations before a change ships.
        </li>
        <li>Accessibility issues found this way have been fixed as they were found.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        Our automated coverage doesn’t yet reach every page, and automated scans only catch a subset
        of real accessibility issues — they don’t replace testing with actual assistive technology.
        If you run into something that doesn’t work well with a screen reader, keyboard navigation,
        or another assistive tool, we want to know about it.
      </p>

      <h2>Contact us</h2>
      <p>
        Found an accessibility barrier, or have feedback on how we can do better? Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPageLayout>
  );
}
