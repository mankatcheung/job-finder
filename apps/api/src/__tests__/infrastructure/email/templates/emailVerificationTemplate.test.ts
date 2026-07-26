import { describe, it, expect } from 'vitest';
import { buildEmailVerificationHtml } from '#src/infrastructure/email/templates/emailVerificationTemplate.js';

describe('buildEmailVerificationHtml', () => {
  it('includes the verify URL as the button link', () => {
    const html = buildEmailVerificationHtml('https://app.jobfinder.com/verify-email?token=abc123');

    expect(html).toContain('href="https://app.jobfinder.com/verify-email?token=abc123"');
  });

  it('mentions the 24 hour expiry and includes safe-to-ignore copy', () => {
    const html = buildEmailVerificationHtml('https://app.jobfinder.com/verify-email?token=abc123');

    expect(html).toContain('expires in 24 hours');
    expect(html).toContain('you can safely ignore this email');
  });
});
