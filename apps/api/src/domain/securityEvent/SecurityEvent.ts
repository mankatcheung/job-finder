export const SECURITY_EVENT_TYPES = [
  'password_changed',
  'email_changed',
  'totp_enabled',
  'totp_disabled',
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
