export interface Session {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}
