import { createHash, randomBytes } from 'crypto';
import type { IShareLinkRepository } from '#src/use-cases/ports/IShareLinkRepository.js';
import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';
import { SHARE_LINK } from '#src/constants.js';

interface Deps {
  shareLinkRepository: IShareLinkRepository;
  generateId: () => string;
}

export interface CreateShareLinkInput {
  userId: string;
  name: string;
}

export interface CreateShareLinkOutput {
  shareLink: ShareLink;
  rawToken: string;
}

export class CreateShareLinkUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateShareLinkInput): Promise<CreateShareLinkOutput> {
    const rawToken = `${SHARE_LINK.PREFIX}${randomBytes(SHARE_LINK.RANDOM_BYTES).toString('hex')}`;
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const link = await this.deps.shareLinkRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      name: input.name,
      tokenHash,
    });

    return { shareLink: link, rawToken };
  }
}
