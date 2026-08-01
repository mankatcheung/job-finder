import type { Session } from '#src/domain/session/Session.js';

export interface SessionDTO {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

export class SessionMapper {
  toDTO(session: Session, currentSessionId: string | undefined): SessionDTO {
    return {
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      deviceLabel: session.deviceLabel,
      location: session.location,
      lastUsedAt: session.lastUsedAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      current: session.id === currentSessionId,
    };
  }
}
