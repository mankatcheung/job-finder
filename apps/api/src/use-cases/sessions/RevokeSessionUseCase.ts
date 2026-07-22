import type { ISessionRepository } from '@/use-cases/ports/ISessionRepository.js';
import { ERROR_CODES } from '@/constants.js';

interface Deps {
  sessionRepository: ISessionRepository;
}

export class RevokeSessionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(sessionId: string, userId: string): Promise<void> {
    const session = await this.deps.sessionRepository.findByIdAndUserId(sessionId, userId);
    if (!session) {
      throw Object.assign(new Error('Session not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    await this.deps.sessionRepository.revoke(sessionId);
  }
}
