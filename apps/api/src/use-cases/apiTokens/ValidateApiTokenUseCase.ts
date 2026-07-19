import { createHash } from 'crypto';
import type { IApiTokenRepository } from '@/use-cases/ports/IApiTokenRepository.js';

interface Deps {
  apiTokenRepository: IApiTokenRepository;
}

export class ValidateApiTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<{ sub: string; email: string } | null> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const result = await this.deps.apiTokenRepository.findByTokenHash(tokenHash);
    if (!result) return null;

    await this.deps.apiTokenRepository.updateLastUsed(result.token.id);

    return { sub: result.token.userId, email: result.userEmail };
  }
}
