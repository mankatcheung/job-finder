import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';

export interface ShareLinkDTO {
  id: string;
  userId: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export class ShareLinkMapper {
  toDTO(link: ShareLink): ShareLinkDTO {
    return {
      id: link.id,
      userId: link.userId,
      name: link.name,
      lastUsedAt: link.lastUsedAt?.toISOString() ?? null,
      createdAt: link.createdAt.toISOString(),
    };
  }
}
