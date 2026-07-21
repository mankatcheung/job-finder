import type { IApiTokenRepository } from '@/use-cases/ports/IApiTokenRepository.js';
import { ERROR_CODES } from '@/constants.js';

interface Deps {
  apiTokenRepository: IApiTokenRepository;
}

export class DeleteApiTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(id: string, userId: string): Promise<void> {
    const token = await this.deps.apiTokenRepository.findByIdAndUserId(id, userId);
    if (!token) {
      throw Object.assign(new Error('API token not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    await this.deps.apiTokenRepository.delete(id);
  }
}
