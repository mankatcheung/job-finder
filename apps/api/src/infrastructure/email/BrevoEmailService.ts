import type { IEmailService, WeeklyDigestData } from '#src/use-cases/ports/IEmailService.js';
import { buildWeeklyDigestHtml } from './templates/weeklyDigestTemplate.js';
import { buildPasswordResetHtml } from './templates/passwordResetTemplate.js';
import { buildEmailVerificationHtml } from './templates/emailVerificationTemplate.js';
import { buildBackupEmailVerificationHtml } from './templates/backupEmailVerificationTemplate.js';
import { buildNewDeviceLoginAlertHtml } from './templates/newDeviceLoginAlertTemplate.js';
import { EMAIL, ENV } from '#src/constants.js';

export class BrevoEmailService implements IEmailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    this.apiKey = process.env[ENV.BREVO_API_KEY] ?? '';
    this.fromEmail = process.env[ENV.FROM_EMAIL] ?? EMAIL.DEFAULT_FROM_EMAIL;
    this.fromName = process.env[ENV.FROM_NAME] ?? EMAIL.DEFAULT_FROM_NAME;
  }

  async sendFollowUpReminder(
    to: string,
    company: string,
    role: string,
    followUpAt: Date,
  ): Promise<void> {
    const date = followUpAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const response = await fetch(EMAIL.BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: `Reminder: Follow up on ${role} at ${company}`,
        htmlContent: `<p>This is a reminder to follow up on your <strong>${role}</strong> application at <strong>${company}</strong>.</p><p>Your scheduled follow-up date is <strong>${date}</strong>.</p>`,
      }),
    });
    if (!response.ok && response.status !== 201) {
      const body = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${body}`);
    }
  }

  async sendWeeklyDigest(
    to: string,
    data: WeeklyDigestData,
    frequency: 'daily' | 'weekly' = 'weekly',
  ): Promise<void> {
    const now = new Date();
    const periodLabel = `${frequency === 'daily' ? 'Day' : 'Week'} of ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    const htmlContent = buildWeeklyDigestHtml(data, periodLabel, frequency);
    const response = await fetch(EMAIL.BREVO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: `Your ${frequency === 'daily' ? 'Daily' : 'Weekly'} Job Search Digest — ${periodLabel}`,
        htmlContent,
      }),
    });
    if (!response.ok && response.status !== 201) {
      const body = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${body}`);
    }
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const htmlContent = buildPasswordResetHtml(resetUrl);
    const response = await fetch(EMAIL.BREVO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: 'Reset your Job Finder password',
        htmlContent,
      }),
    });
    if (!response.ok && response.status !== 201) {
      const body = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${body}`);
    }
  }

  async sendEmailVerification(to: string, verifyUrl: string): Promise<void> {
    const htmlContent = buildEmailVerificationHtml(verifyUrl);
    const response = await fetch(EMAIL.BREVO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: 'Verify your Job Finder email',
        htmlContent,
      }),
    });
    if (!response.ok && response.status !== 201) {
      const body = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${body}`);
    }
  }

  async sendBackupEmailVerification(to: string, verifyUrl: string): Promise<void> {
    const htmlContent = buildBackupEmailVerificationHtml(verifyUrl);
    const response = await fetch(EMAIL.BREVO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: 'Verify your backup email for Job Finder',
        htmlContent,
      }),
    });
    if (!response.ok && response.status !== 201) {
      const body = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${body}`);
    }
  }

  async sendNewDeviceLoginAlert(
    to: string,
    deviceLabel: string,
    location: string | null,
    ipAddress: string | null,
    loginTime: Date,
  ): Promise<void> {
    const htmlContent = buildNewDeviceLoginAlertHtml(deviceLabel, location, ipAddress, loginTime);
    const response = await fetch(EMAIL.BREVO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: 'New device signed in to your Job Finder account',
        htmlContent,
      }),
    });
    if (!response.ok && response.status !== 201) {
      const body = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${body}`);
    }
  }
}
