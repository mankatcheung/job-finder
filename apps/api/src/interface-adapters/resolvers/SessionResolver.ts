import type { ListSessionsUseCase } from '#src/use-cases/sessions/ListSessionsUseCase.js';
import type { RevokeSessionUseCase } from '#src/use-cases/sessions/RevokeSessionUseCase.js';
import type { RevokeOtherSessionsUseCase } from '#src/use-cases/sessions/RevokeOtherSessionsUseCase.js';
import type { SessionMapper, SessionDTO } from '#src/interface-adapters/mappers/SessionMapper.js';

interface Deps {
  listSessionsUseCase: ListSessionsUseCase;
  revokeSessionUseCase: RevokeSessionUseCase;
  revokeOtherSessionsUseCase: RevokeOtherSessionsUseCase;
  sessionMapper: SessionMapper;
}

export class SessionResolver {
  constructor(private readonly deps: Deps) {}

  async listSessions(userId: string, currentSessionId: string | undefined): Promise<SessionDTO[]> {
    const sessions = await this.deps.listSessionsUseCase.execute(userId);
    return sessions.map((session) => this.deps.sessionMapper.toDTO(session, currentSessionId));
  }

  async revokeSession(
    userId: string,
    id: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<boolean> {
    await this.deps.revokeSessionUseCase.execute(id, userId, ipAddress, userAgent);
    return true;
  }

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<boolean> {
    await this.deps.revokeOtherSessionsUseCase.execute(
      userId,
      currentSessionId,
      ipAddress,
      userAgent,
    );
    return true;
  }
}
