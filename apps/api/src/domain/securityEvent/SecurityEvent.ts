export const SECURITY_EVENT_TYPES = [
  'password_changed',
  'email_changed',
  'totp_enabled',
  'totp_disabled',
  'totp_backup_codes_regenerated',
  'session_revoked',
  'other_sessions_revoked',
  'mcp_oauth_authorized',
  'mcp_oauth_token_issued',
  'mcp_oauth_refresh_reuse_detected',
  'mcp_oauth_token_revoked',
] as const;

export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

export type SecurityEvent = {
  id: string;
  userId: string;
  eventType: SecurityEventType;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};
