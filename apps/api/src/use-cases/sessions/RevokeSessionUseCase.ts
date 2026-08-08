import type { ISessionRepository } from '#src/use-cases/ports/ISessionRepository.js';
import type { ISecurityEventRepository } from '#src/use-cases/ports/ISecurityEventRepository.js';
import { ERROR_CODES } from '#src/constants.js';

interface Deps {
  sessionRepository: ISessionRepository;
  securityEventRepository: ISecurityEventRepository;
  generateId: () => string;
}

export class RevokeSessionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(
    sessionId: string,
    userId: string,
    ipAddress: string | null = null,
    userAgent: string | null = null,
  ): Promise<void> {
    const session = await this.deps.sessionRepository.findByIdAndUserId(sessionId, userId);
    if (!session) {
      throw Object.assign(new Error('Session not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    await this.deps.sessionRepository.revoke(sessionId);

    await this.deps.securityEventRepository.create({
      id: this.deps.generateId(),
      userId,
      eventType: 'session_revoked',
      ipAddress,
      userAgent,
    });
  }
}
