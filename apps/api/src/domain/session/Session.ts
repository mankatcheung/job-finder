export interface Session {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  currentRefreshTokenId: string | null;
  previousRefreshTokenId: string | null;
  previousRotatedAt: Date | null;
}
