import type { OAuthAccount } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthAccountRepository } from '#src/use-cases/ports/IOAuthAccountRepository.js';
import type { IListLinkedOAuthAccountsUseCase } from '#src/use-cases/oauth/IListLinkedOAuthAccountsUseCase.js';

interface Deps {
  oauthAccountRepository: IOAuthAccountRepository;
}

export class ListLinkedOAuthAccountsUseCase implements IListLinkedOAuthAccountsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<OAuthAccount[]> {
    return this.deps.oauthAccountRepository.findAllByUserId(userId);
  }
}
