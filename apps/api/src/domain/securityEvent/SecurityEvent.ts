export const SECURITY_EVENT_TYPES = [
  'password_changed',
  'email_changed',
  'totp_enabled',
  'totp_disabled',
  'totp_backup_codes_regenerated',
  'session_revoked',
  'other_sessions_revoked',
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
