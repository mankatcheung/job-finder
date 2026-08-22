import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleEmailService } from '#src/infrastructure/email/ConsoleEmailService.js';

describe('ConsoleEmailService', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    logSpy.mockRestore();
  });

  it('logs instead of making a network call, for every port method', async () => {
    const service = new ConsoleEmailService();

    await service.sendFollowUpReminder('a@b.com', 'Acme', 'Engineer', new Date('2024-06-15'));
    await service.sendWeeklyDigest('a@b.com', {
      totalApplications: 0,
      byStatus: {},
      newThisWeek: [],
      overdueFollowUps: [],
      upcomingFollowUps: [],
    });
    await service.sendPasswordReset('a@b.com', 'https://example.com/reset');
    await service.sendEmailVerification('a@b.com', 'https://example.com/verify');
    await service.sendBackupEmailVerification('a@b.com', 'https://example.com/verify-backup');
    await service.sendNewDeviceLoginAlert(
      'a@b.com',
      'Chrome on macOS',
      'San Francisco, CA',
      '1.2.3.4',
      new Date('2024-06-15'),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledTimes(6);
  });

  it('includes the confirmation URL, so a developer without a Brevo key can still complete the flow', async () => {
    const service = new ConsoleEmailService();

    await service.sendEmailVerification('a@b.com', 'https://example.com/verify?token=abc');

    expect(logSpy.mock.calls[0][0]).toContain('https://example.com/verify?token=abc');
  });
});
