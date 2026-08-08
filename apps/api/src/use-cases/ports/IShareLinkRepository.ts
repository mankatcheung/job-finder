import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';

export interface CreateShareLinkData {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
}

export interface IShareLinkRepository {
  findAllByUserId(userId: string): Promise<ShareLink[]>;
  findByTokenHash(tokenHash: string): Promise<ShareLink | null>;
  findByIdAndUserId(id: string, userId: string): Promise<ShareLink | null>;
  create(data: CreateShareLinkData): Promise<ShareLink>;
  updateLastUsed(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
