import { describe, it, expect } from 'vitest';
import { buildPasswordResetHtml } from '@/infrastructure/email/templates/passwordResetTemplate.js';

describe('buildPasswordResetHtml', () => {
  it('includes the reset URL as the button link', () => {
    const html = buildPasswordResetHtml('https://app.jobfinder.com/reset-password?token=abc123');

    expect(html).toContain('href="https://app.jobfinder.com/reset-password?token=abc123"');
  });

  it('mentions the 1 hour expiry and includes safe-to-ignore copy', () => {
    const html = buildPasswordResetHtml('https://app.jobfinder.com/reset-password?token=abc123');

    expect(html).toContain('expires in 1 hour');
    expect(html).toContain('you can safely ignore this email');
  });
});
