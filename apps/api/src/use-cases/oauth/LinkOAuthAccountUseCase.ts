import { ConflictError } from '#src/use-cases/errors/DomainError.js';
import type { IOAuthAccountRepository } from '#src/use-cases/ports/IOAuthAccountRepository.js';
import type { IOAuthProviderRegistry } from '#src/use-cases/ports/IOAuthProviderRegistry.js';
import type {
  ILinkOAuthAccountUseCase,
  LinkOAuthAccountInput,
} from '#src/use-cases/oauth/ILinkOAuthAccountUseCase.js';

interface Deps {
  oauthAccountRepository: IOAuthAccountRepository;
  oauthProviderRegistry: IOAuthProviderRegistry;
  generateId: () => string;
}

export class LinkOAuthAccountUseCase implements ILinkOAuthAccountUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LinkOAuthAccountInput): Promise<void> {
    const provider = this.deps.oauthProviderRegistry.get(input.provider);
    const profile = await provider.exchangeCodeForProfile(
      input.code,
      input.redirectUri,
      input.codeVerifier,
    );

    const existing = await this.deps.oauthAccountRepository.findByProvider(
      input.provider,
      profile.providerAccountId,
    );
    if (existing) {
      if (existing.userId === input.userId) return; // Already linked — idempotent no-op.
      throw new ConflictError('This account is already linked to another user');
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
