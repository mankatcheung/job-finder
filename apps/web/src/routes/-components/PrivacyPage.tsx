import { LegalPageLayout } from '#/components/LegalPageLayout';

const LAST_UPDATED = 'August 22, 2026';
const CONTACT_EMAIL = 'privacy@trakwyn.com';

/**
 * Drafted from what the app actually collects and does, per JEF-202 — not
 * legally reviewed. Needs a founder/counsel pass before being treated as
 * authoritative, but reads as a complete policy rather than a stub: that's
 * what Google's OAuth consent-screen requirement (a working Privacy Policy
 * URL) and a real user landing on this page both need.
 */
export function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        Trakwyn (“Trakwyn”, “we”, “us”) helps you track job applications, interviews, and offers.
        This policy explains what information we collect, how we use it, and the choices you have.
      </p>

      <h2>Information we collect</h2>

      <h3>Account information</h3>
      <p>
        When you create an account, we collect your email address and a password (stored as a salted
        hash — we never see or store your password in plain text). You may optionally add your name,
        timezone, and target role.
      </p>
      <p>
        If you sign in with Google or GitHub instead, we receive your name, email address, and a
        profile identifier from that provider. We never see your Google or GitHub password.
      </p>

      <h3>Job search data you provide</h3>
      <p>
        Everything you enter to track your job search: applications (company, role, status, notes),
        contacts, interview rounds, offers, and any documents (résumés, cover letters, offer
        letters) you upload.
      </p>

      <h3>Security and device information</h3>
      <p>
        To protect your account, we log the IP address, approximate location, and device/browser
        information associated with sign-ins and certain security-sensitive actions (password
        changes, two-factor authentication changes, session revocations). This is what powers “new
        device signed in” alerts and the active-sessions list in Settings.
      </p>

      <h3>AI features, if you use them</h3>
      <p>
        Trakwyn’s AI features (cover letter generation, résumé matching, the assistant) are
        bring-your-own-key: you provide your own API key for a provider you choose (e.g. OpenRouter,
        Google AI). Your key is encrypted at rest. When you use an AI feature, the relevant content
        (e.g. a job description, your résumé text) is sent directly to the provider you configured —
        not stored or processed by any AI service of ours. That provider’s own privacy policy
        governs how they handle it.
      </p>

      <h3>Cookies</h3>
      <p>
        We use cookies necessary to keep you signed in, which can’t be switched off, and, only where
        you’ve opted in, analytics cookies to understand how Trakwyn is used. You can review or
        change your choice anytime via “Cookie preferences” in the site footer.
      </p>

      <h2>How we use this information</h2>
      <ul>
        <li>
          To operate Trakwyn — storing and displaying the data you enter, keeping you signed in.
        </li>
        <li>
          To secure your account — detecting unfamiliar sign-ins, supporting password resets and
          two-factor authentication.
        </li>
        <li>
          To send account-related email — email verification, password reset, security alerts, and,
          if you’ve enabled it, a weekly or daily digest of your job search activity. You can turn
          optional emails off in Settings.
        </li>
        <li>To fix bugs and improve the product, using aggregated, anonymized usage data.</li>
      </ul>

      <h2>How we share information</h2>
      <p>We do not sell your personal information. We share it only with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> who process it on our behalf to run Trakwyn — our
          hosting provider, our email delivery provider, and, only if you’ve configured them, the
          OAuth provider you sign in with and the AI provider you bring your own key for.
        </li>
        <li>
          <strong>Law enforcement or other parties</strong> if required by law, or to protect the
          rights, property, or safety of Trakwyn, our users, or others.
        </li>
      </ul>

      <h2>Your data, your control</h2>
      <p>
        You can export a full copy of your data, or permanently delete your account, at any time
        from Settings. Deleting your account is a hard delete — it removes your applications,
        documents, notes, and the security/login records described above, not a soft delete or
        deactivation. Once deleted, we cannot recover it.
      </p>

      <h2>Data security</h2>
      <p>
        Passwords are hashed, sensitive fields (like AI provider keys and two-factor secrets) are
        encrypted at rest, and account access supports two-factor authentication. No method of
        transmission or storage is 100% secure, but we work to protect your information using
        practices appropriate to the sensitivity of the data involved.
      </p>

      <h2>Children’s privacy</h2>
      <p>
        Trakwyn is not directed at children, and we do not knowingly collect information from anyone
        under 16. If you believe a child has provided us information, contact us and we will delete
        it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. If we make material changes, we’ll update the
        “Last updated” date above and, where appropriate, notify you directly.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy or your data? Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPageLayout>
  );
}
