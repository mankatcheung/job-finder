import type { Application } from '#src/domain/application/Application.js';

export const LIKELY_GHOSTED_AFTER_DAYS = 14;
const LIKELY_GHOSTED_AFTER_MS = LIKELY_GHOSTED_AFTER_DAYS * 24 * 60 * 60 * 1000;

export function isLikelyGhosted(application: Application, now = new Date()): boolean {
  if (!['applied', 'interviewing'].includes(application.status) || !application.appliedAt) {
    return false;
  }

  const cutoff = now.getTime() - LIKELY_GHOSTED_AFTER_MS;
  return (
    application.updatedAt.getTime() <= cutoff &&
    (application.reminderSentAt == null || application.reminderSentAt.getTime() <= cutoff)
  );
}
