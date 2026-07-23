export function buildEmailVerificationHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px 32px 24px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Verify your email</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.5;">
        Confirm this is your email address to finish setting up your Job Finder account. Click
        the button below. This link expires in 24 hours.
      </p>
      <p style="margin:0 0 28px;text-align:center;">
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Verify email
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}
