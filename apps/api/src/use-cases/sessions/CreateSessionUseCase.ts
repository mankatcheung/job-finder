import type { ISessionRepository } from '@/use-cases/ports/ISessionRepository.js';
import type { Session } from '@/domain/session/Session.js';
import { SESSION } from '@/constants.js';

interface Deps {
  sessionRepository: ISessionRepository;
  generateId: () => string;
}

export interface CreateSessionInput {
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
}

export class CreateSessionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateSessionInput): Promise<Session> {
    return this.deps.sessionRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: new Date(Date.now() + SESSION.TTL_MS),
    });
  }
}
