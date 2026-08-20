import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IApiTokenRepository } from '#src/use-cases/ports/IApiTokenRepository.js';

interface Deps {
  apiTokenRepository: IApiTokenRepository;
}

export class DeleteApiTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(id: string, userId: string): Promise<void> {
    const token = await this.deps.apiTokenRepository.findByIdAndUserId(id, userId);
    if (!token) {
      throw new NotFoundError('API token not found');
    }
    await this.deps.apiTokenRepository.delete(id);
  }
}
