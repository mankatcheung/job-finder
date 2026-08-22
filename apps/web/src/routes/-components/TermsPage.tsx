import { LegalPageLayout } from '#/components/LegalPageLayout';
import { Link } from '@tanstack/react-router';

const LAST_UPDATED = 'August 22, 2026';
const CONTACT_EMAIL = 'privacy@trakwyn.com';

/**
 * Drafted from what the app actually does, per JEF-202 — not legally
 * reviewed, and "governing law" below is a placeholder that needs a real
 * jurisdiction filled in. See PrivacyPage.tsx for the same caveat in more
 * detail; it applies here too.
 */
export function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These terms govern your use of Trakwyn. By creating an account or using Trakwyn, you agree
        to them. If you don’t agree, please don’t use Trakwyn.
      </p>

      <h2>The service</h2>
      <p>
        Trakwyn is a job-search tracking tool: applications, interviews, offers, documents, and
        optional AI-assisted features. Trakwyn is currently provided free of charge. We may
        introduce paid plans in the future; if we do, this policy will be updated and you’ll be told
        before anything you’re using becomes paid.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 16 years old to use Trakwyn.</li>
        <li>
          You’re responsible for the accuracy of the information you provide when registering.
        </li>
        <li>
          You’re responsible for keeping your password confidential and for all activity under your
          account. Tell us right away if you suspect unauthorized access — Settings lets you revoke
          sessions and enable two-factor authentication.
        </li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own the applications, notes, documents, and other content you add to Trakwyn (“your
        content”). You grant us a limited license to store, process, and display your content solely
        to provide the service to you. We don’t use your content to train AI models, and we don’t
        share it except as described in the <Link to="/privacy">Privacy Policy</Link>.
      </p>
      <p>
        If you use a bring-your-own-key AI feature, you’re responsible for complying with your
        chosen AI provider’s own terms and for any costs they charge you directly — Trakwyn does not
        bill you for AI usage and is not a party to your agreement with that provider.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use Trakwyn for anything unlawful, or to violate anyone else’s rights.</li>
        <li>
          Attempt to gain unauthorized access to Trakwyn, other users’ accounts, or our systems.
        </li>
        <li>Scrape, reverse-engineer, or interfere with Trakwyn’s operation.</li>
        <li>
          Upload malicious code or content that infringes someone else’s intellectual property.
        </li>
      </ul>

      <h2>Termination</h2>
      <p>
        You can delete your account at any time from Settings — this is a permanent, hard delete of
        your data, not a deactivation. We may suspend or terminate your access if you violate these
        terms, with notice where reasonably possible.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Trakwyn is provided “as is,” without warranties of any kind, express or implied. We don’t
        guarantee the service will be uninterrupted, error-free, or that any AI-generated content
        (cover letters, résumé feedback, and similar) will be accurate or suitable for your purposes
        — always review AI-generated content before relying on it.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Trakwyn and its operators are not liable for any
        indirect, incidental, or consequential damages arising from your use of the service, or for
        the accuracy of AI-generated content or third-party AI providers you’ve chosen to connect.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. If we make material changes, we’ll update the
        “Last updated” date above and, where appropriate, notify you directly. Continuing to use
        Trakwyn after a change means you accept the updated terms.
      </p>

      {/*
        No "Governing law" section: it needs a real jurisdiction (where
        Trakwyn is operated from/incorporated), which isn't something to
        guess at. Add one — "These terms are governed by the laws of
        [X], without regard to its conflict-of-law principles." — once
        that's confirmed. Omitting it is safer than a rendered placeholder
        a real visitor (or Google's review) could see.
      */}

      <h2>Contact us</h2>
      <p>
        Questions about these terms? Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPageLayout>
  );
}
