import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IShareLinkRepository } from '#src/use-cases/ports/IShareLinkRepository.js';

interface Deps {
  shareLinkRepository: IShareLinkRepository;
}

export class DeleteShareLinkUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(id: string, userId: string): Promise<void> {
    const link = await this.deps.shareLinkRepository.findByIdAndUserId(id, userId);
    if (!link) {
      throw new NotFoundError('Share link not found');
    }
    await this.deps.shareLinkRepository.delete(id);
  }
}
