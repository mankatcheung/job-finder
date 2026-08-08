export interface ShareLink {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}
