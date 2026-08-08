import type { IShareLinkRepository } from '#src/use-cases/ports/IShareLinkRepository.js';
import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';

interface Deps {
  shareLinkRepository: IShareLinkRepository;
}

export class ListShareLinksUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<ShareLink[]> {
    return this.deps.shareLinkRepository.findAllByUserId(userId);
  }
}
