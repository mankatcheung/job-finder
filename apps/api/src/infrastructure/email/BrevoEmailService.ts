import type { IEmailService, WeeklyDigestData } from '@/use-cases/ports/IEmailService.js';
import { buildWeeklyDigestHtml } from './templates/weeklyDigestTemplate.js';
import { EMAIL, ENV } from '@/constants.js';

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

  async sendWeeklyDigest(to: string, data: WeeklyDigestData): Promise<void> {
    const now = new Date();
    const weekLabel = `Week of ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    const htmlContent = buildWeeklyDigestHtml(data, weekLabel);
    const response = await fetch(EMAIL.BREVO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to }],
        subject: `Your Weekly Job Search Digest — ${weekLabel}`,
        htmlContent,
      }),
    });
    if (!response.ok && response.status !== 201) {
      const body = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${body}`);
    }
  }
}
