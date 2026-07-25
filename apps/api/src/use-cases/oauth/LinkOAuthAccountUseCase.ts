import type { IOAuthAccountRepository } from '@/use-cases/ports/IOAuthAccountRepository.js';
import type { IOAuthProviderRegistry } from '@/use-cases/ports/IOAuthProviderRegistry.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  ILinkOAuthAccountUseCase,
  LinkOAuthAccountInput,
} from '@/use-cases/oauth/ILinkOAuthAccountUseCase.js';

interface Deps {
  oauthAccountRepository: IOAuthAccountRepository;
  oauthProviderRegistry: IOAuthProviderRegistry;
  generateId: () => string;
}

export class LinkOAuthAccountUseCase implements ILinkOAuthAccountUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LinkOAuthAccountInput): Promise<void> {
    const provider = this.deps.oauthProviderRegistry.get(input.provider);
    const profile = await provider.exchangeCodeForProfile(input.code, input.redirectUri);

    const existing = await this.deps.oauthAccountRepository.findByProvider(
      input.provider,
      profile.providerAccountId,
    );
    if (existing) {
      if (existing.userId === input.userId) return; // Already linked — idempotent no-op.
      throw Object.assign(new Error('This account is already linked to another user'), {
        code: ERROR_CODES.CONFLICT,
      });
    }

    await this.deps.oauthAccountRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      provider: input.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
    });
  }
}
