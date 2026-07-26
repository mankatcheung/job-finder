import type { ISessionRepository } from '#src/use-cases/ports/ISessionRepository.js';
import type { Session } from '#src/domain/session/Session.js';

interface Deps {
  sessionRepository: ISessionRepository;
}

export class ListSessionsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<Session[]> {
    return this.deps.sessionRepository.findActiveByUserId(userId);
  }
}
