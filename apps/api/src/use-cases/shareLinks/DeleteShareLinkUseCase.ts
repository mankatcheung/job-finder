import type { IShareLinkRepository } from '#src/use-cases/ports/IShareLinkRepository.js';
import { ERROR_CODES } from '#src/constants.js';

interface Deps {
  shareLinkRepository: IShareLinkRepository;
}

export class DeleteShareLinkUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(id: string, userId: string): Promise<void> {
    const link = await this.deps.shareLinkRepository.findByIdAndUserId(id, userId);
    if (!link) {
      throw Object.assign(new Error('Share link not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    await this.deps.shareLinkRepository.delete(id);
  }
}
