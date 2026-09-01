import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrevoEmailService } from '#src/infrastructure/email/BrevoEmailService.js';
import { buildWeeklyDigestHtml } from '#src/infrastructure/email/templates/weeklyDigestTemplate.js';
import { buildPasswordResetHtml } from '#src/infrastructure/email/templates/passwordResetTemplate.js';
import { buildEmailVerificationHtml } from '#src/infrastructure/email/templates/emailVerificationTemplate.js';
import { EMAIL, ENV } from '#src/infrastructure/config/constants.js';
import type { WeeklyDigestData } from '#src/use-cases/ports/IEmailService.js';

const jsonResponse = (ok: boolean, status: number, body = '') => ({
  ok,
  status,
  text: () => Promise.resolve(body),
});

describe('BrevoEmailService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env[ENV.BREVO_API_KEY] = 'test-api-key';
    delete process.env[ENV.FROM_EMAIL];
    delete process.env[ENV.FROM_NAME];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('sendFollowUpReminder', () => {
    it('posts to the Brevo API URL with the api-key header', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await service.sendFollowUpReminder(
        'user@example.com',
        'Acme Corp',
        'Software Engineer',
        new Date('2024-06-15'),
      );

      const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(EMAIL.BREVO_API_URL);
      expect((options.headers as Record<string, string>)['api-key']).toBe('test-api-key');
    });

    it('uses the default sender when FROM_EMAIL/FROM_NAME are not set', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await service.sendFollowUpReminder(
        'user@example.com',
        'Acme Corp',
        'Software Engineer',
        new Date('2024-06-15'),
      );

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.sender).toEqual({
        name: EMAIL.DEFAULT_FROM_NAME,
        email: EMAIL.DEFAULT_FROM_EMAIL,
      });
    });

    it('uses FROM_EMAIL/FROM_NAME when set', async () => {
      process.env[ENV.FROM_EMAIL] = 'hello@custom.com';
      process.env[ENV.FROM_NAME] = 'Custom Sender';
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await service.sendFollowUpReminder(
        'user@example.com',
        'Acme Corp',
        'Software Engineer',
        new Date('2024-06-15'),
      );

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.sender).toEqual({ name: 'Custom Sender', email: 'hello@custom.com' });
    });

    it('includes the recipient, company, role and formatted date', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await service.sendFollowUpReminder(
        'user@example.com',
        'Acme Corp',
        'Software Engineer',
        new Date('2024-06-15T00:00:00.000Z'),
      );

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.to).toEqual([{ email: 'user@example.com' }]);
      expect(body.subject).toBe('Reminder: Follow up on Software Engineer at Acme Corp');
      expect(body.htmlContent).toContain('Acme Corp');
      expect(body.htmlContent).toContain('Software Engineer');
    });

    it('throws with the status and body when the response fails', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(false, 500, 'server error') as never);
      const service = new BrevoEmailService();

      await expect(
        service.sendFollowUpReminder(
          'user@example.com',
          'Acme Corp',
          'Software Engineer',
          new Date('2024-06-15'),
        ),
      ).rejects.toThrow(/Brevo API error 500/);
    });

    it('does not throw when the response is ok', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await expect(
        service.sendFollowUpReminder(
          'user@example.com',
          'Acme Corp',
          'Software Engineer',
          new Date('2024-06-15'),
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendWeeklyDigest', () => {
    const data: WeeklyDigestData = {
      totalApplications: 5,
      byStatus: { applied: 5 },
      newThisWeek: [{ company: 'Acme Corp', role: 'Software Engineer' }],
      overdueFollowUps: [],
      upcomingFollowUps: [],
    };

    it('builds the subject from the current week and posts the rendered template', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-01T00:00:00.000Z'));
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await service.sendWeeklyDigest('user@example.com', data);

      const weekLabel = 'Week of June 1, 2024';
      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.subject).toBe(`Your Weekly Job Search Digest — ${weekLabel}`);
      expect(body.htmlContent).toBe(buildWeeklyDigestHtml(data, weekLabel));
    });

    it('throws with the status and body when the response fails', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(false, 503, 'unavailable') as never);
      const service = new BrevoEmailService();

      await expect(service.sendWeeklyDigest('user@example.com', data)).rejects.toThrow(
        /Brevo API error 503/,
      );
    });
  });

  describe('sendPasswordReset', () => {
    const resetUrl = 'https://app.jobfinder.com/reset-password?token=abc123';

    it('posts a subject and htmlContent built from the reset URL', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await service.sendPasswordReset('user@example.com', resetUrl);

      const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(url).toBe(EMAIL.BREVO_API_URL);
      expect(body.to).toEqual([{ email: 'user@example.com' }]);
      expect(body.subject).toBe('Reset your Trakwyn password');
      expect(body.htmlContent).toBe(buildPasswordResetHtml(resetUrl));
    });

    it('throws with the status and body when the response fails', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(false, 503, 'unavailable') as never);
      const service = new BrevoEmailService();

      await expect(service.sendPasswordReset('user@example.com', resetUrl)).rejects.toThrow(
        /Brevo API error 503/,
      );
    });
  });

  describe('sendEmailVerification', () => {
    const verifyUrl = 'https://app.jobfinder.com/verify-email?token=abc123';

    it('posts a subject and htmlContent built from the verify URL', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(true, 200) as never);
      const service = new BrevoEmailService();

      await service.sendEmailVerification('user@example.com', verifyUrl);

      const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(url).toBe(EMAIL.BREVO_API_URL);
      expect(body.to).toEqual([{ email: 'user@example.com' }]);
      expect(body.subject).toBe('Verify your Trakwyn email');
      expect(body.htmlContent).toBe(buildEmailVerificationHtml(verifyUrl));
    });

    it('throws with the status and body when the response fails', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(false, 503, 'unavailable') as never);
      const service = new BrevoEmailService();

      await expect(service.sendEmailVerification('user@example.com', verifyUrl)).rejects.toThrow(
        /Brevo API error 503/,
      );
    });
  });
});
