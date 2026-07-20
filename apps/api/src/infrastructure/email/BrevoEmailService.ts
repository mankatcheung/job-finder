import type { IEmailService } from '@/use-cases/ports/IEmailService.js';

export class BrevoEmailService implements IEmailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY ?? '';
    this.fromEmail = process.env.FROM_EMAIL ?? 'noreply@jobfinder.app';
    this.fromName = process.env.FROM_NAME ?? 'Job Finder';
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
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
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
}
