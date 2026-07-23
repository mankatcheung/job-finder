import type { ISessionRepository } from '@/use-cases/ports/ISessionRepository.js';

interface Deps {
  sessionRepository: ISessionRepository;
}

export class RevokeOtherSessionsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string, currentSessionId: string): Promise<void> {
    await this.deps.sessionRepository.revokeAllForUserExcept(userId, currentSessionId);
  }
}
