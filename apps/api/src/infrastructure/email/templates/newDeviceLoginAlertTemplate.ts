import { ENV } from '#src/infrastructure/config/constants.js';

export function buildNewDeviceLoginAlertHtml(
  deviceLabel: string,
  location: string | null,
  ipAddress: string | null,
  loginTime: Date,
): string {
  // No fallback on purpose. This link is the entire point of the email — it is
  // where someone goes when they think their account is compromised — so a
  // guessed origin would send them somewhere that is not Trakwyn at the exact
  // moment they most need it to be. Failing to send beats sending a wrong
  // address, and an unset variable is a deployment mistake worth surfacing
  // rather than papering over.
  const webAppOrigin = process.env[ENV.WEB_APP_ORIGIN]?.trim();
  if (!webAppOrigin) {
    throw new Error(
      `${ENV.WEB_APP_ORIGIN} is not set — refusing to build a security alert email without a trustworthy link`,
    );
  }

  const dateStr = loginTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const locationLine = location
    ? `<p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Location: ${location}</p>`
    : '';
  const ipLine = ipAddress
    ? `<p style="margin:0 0 8px;color:#6b7280;font-size:14px;">IP: ${ipAddress}</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
    <div style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827;">New device signed in to your account</h1>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">
        A new device was used to sign in to your <strong>Trakwyn</strong> account.
      </p>
      <div style="background-color:#f3f4f6;border-radius:8px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-weight:600;color:#111827;font-size:15px;">${deviceLabel}</p>
        ${locationLine}
        ${ipLine}
        <p style="margin:0;color:#6b7280;font-size:13px;">${dateStr}</p>
      </div>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;">
        If this was you, no action is needed.
      </p>
      <p style="margin:0;color:#374151;font-size:14px;">
        If you don't recognise this activity, please <a href="${webAppOrigin}/settings/security" style="color:#2563eb;text-decoration:underline;">review your active sessions</a> and revoke any you don't recognise. You should also consider changing your password.
      </p>
    </div>
    <p style="margin:16px 0 0;text-align:center;color:#9ca3af;font-size:12px;">
      Trakwyn
    </p>
  </div>
</body>
</html>`;
}
