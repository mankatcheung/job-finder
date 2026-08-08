import type { WeeklyDigestData } from '#src/use-cases/ports/IEmailService.js';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function buildWeeklyDigestHtml(
  data: WeeklyDigestData,
  periodLabel: string,
  frequency: 'daily' | 'weekly' = 'weekly',
): string {
  const period = frequency === 'daily' ? 'today' : 'this week';
  const statusRows = Object.entries(data.byStatus)
    .filter(([, count]) => count > 0)
    .map(
      ([status, count]) =>
        `<tr>
          <td style="padding:6px 0;color:#374151;">${STATUS_LABELS[status] ?? status}</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;">${count}</td>
        </tr>`,
    )
    .join('');

  const newAppsHtml =
    data.newThisWeek.length === 0
      ? `<p style="color:#9ca3af;font-size:14px;margin:0;">No new applications ${period}.</p>`
      : data.newThisWeek
          .map(
            (a) =>
              `<div style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <span style="font-weight:600;color:#111827;">${a.company}</span>
            <span style="color:#6b7280;margin-left:6px;">— ${a.role}</span>
          </div>`,
          )
          .join('');

  const overdueHtml =
    data.overdueFollowUps.length === 0
      ? '<p style="color:#9ca3af;font-size:14px;margin:0;">No overdue follow-ups. 🎉</p>'
      : data.overdueFollowUps
          .map(
            (a) =>
              `<div style="padding:8px 0;border-bottom:1px solid #fef2f2;">
            <span style="font-weight:600;color:#111827;">${a.company}</span>
            <span style="color:#6b7280;margin-left:6px;">— ${a.role}</span>
            <span style="color:#ef4444;font-size:12px;margin-left:8px;">Due ${a.followUpAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>`,
          )
          .join('');

  const upcomingHtml =
    data.upcomingFollowUps.length === 0
      ? `<p style="color:#9ca3af;font-size:14px;margin:0;">No upcoming follow-ups ${period}.</p>`
      : data.upcomingFollowUps
          .map(
            (a) =>
              `<div style="padding:8px 0;border-bottom:1px solid #f0fdf4;">
            <span style="font-weight:600;color:#111827;">${a.company}</span>
            <span style="color:#6b7280;margin-left:6px;">— ${a.role}</span>
            <span style="color:#16a34a;font-size:12px;margin-left:8px;">${a.followUpAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>`,
          )
          .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px 32px 24px;">
       <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Your ${frequency === 'daily' ? 'Daily' : 'Weekly'} Job Search Digest</h1>
       <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;">${periodLabel}</p>
    </div>

    <!-- Overview -->
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
      <div style="display:inline-block;background:#eff6ff;border-radius:8px;padding:16px 24px;text-align:center;min-width:120px;">
        <p style="margin:0;font-size:36px;font-weight:700;color:#1d4ed8;">${data.totalApplications}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Total applications</p>
      </div>
      <table style="width:100%;margin-top:16px;border-collapse:collapse;">
        ${statusRows}
      </table>
    </div>

    <!-- New this week -->
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">
         🆕 New ${period} <span style="font-weight:400;color:#6b7280;">(${data.newThisWeek.length})</span>
      </h2>
      ${newAppsHtml}
    </div>

    <!-- Overdue follow-ups -->
    ${
      data.overdueFollowUps.length > 0
        ? `<div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;background:#fff5f5;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#991b1b;">
        ⚠️ Overdue follow-ups <span style="font-weight:400;color:#b91c1c;">(${data.overdueFollowUps.length})</span>
      </h2>
      ${overdueHtml}
    </div>`
        : ''
    }

    <!-- Upcoming follow-ups -->
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111827;">
         📅 Upcoming follow-ups ${period} <span style="font-weight:400;color:#6b7280;">(${data.upcomingFollowUps.length})</span>
      </h2>
      ${upcomingHtml}
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;text-align:center;background:#f9fafb;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Keep going — consistency wins job searches.
      </p>
    </div>
  </div>
</body>
</html>`;
}
