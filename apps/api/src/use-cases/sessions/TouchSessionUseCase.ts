import type { ISessionRepository } from '@/use-cases/ports/ISessionRepository.js';
import type { Session } from '@/domain/session/Session.js';
import { ERROR_CODES, SESSION } from '@/constants.js';

interface Deps {
  sessionRepository: ISessionRepository;
}

export class TouchSessionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(sessionId: string): Promise<Session> {
    const session = await this.deps.sessionRepository.findById(sessionId);
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw Object.assign(new Error('Session revoked or expired'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    const expiresAt = new Date(Date.now() + SESSION.TTL_MS);
    await this.deps.sessionRepository.touch(sessionId, expiresAt);

    return { ...session, lastUsedAt: new Date(), expiresAt };
  }
}
