import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { IListLinkedOAuthAccountsUseCase } from '#src/use-cases/oauth/IListLinkedOAuthAccountsUseCase.js';
import type { IUnlinkOAuthAccountUseCase } from '#src/use-cases/oauth/IUnlinkOAuthAccountUseCase.js';
import type { IExchangeMobileOAuthCodeUseCase } from '#src/use-cases/oauth/IExchangeMobileOAuthCodeUseCase.js';
import type { MobileOAuthTokens } from '#src/use-cases/ports/IMobileOAuthHandoffService.js';
import type { LinkedOAuthAccountDTO } from '#src/interface-adapters/mappers/OAuthAccountMapper.js';
import type { OAuthAccountMapper } from '#src/interface-adapters/mappers/OAuthAccountMapper.js';

interface Deps {
  listLinkedOAuthAccountsUseCase: IListLinkedOAuthAccountsUseCase;
  unlinkOAuthAccountUseCase: IUnlinkOAuthAccountUseCase;
  exchangeMobileOAuthCodeUseCase: IExchangeMobileOAuthCodeUseCase;
  oauthAccountMapper: OAuthAccountMapper;
}

export class OAuthResolver {
  constructor(private readonly deps: Deps) {}

  async listLinkedAccounts(userId: string): Promise<LinkedOAuthAccountDTO[]> {
    const links = await this.deps.listLinkedOAuthAccountsUseCase.execute(userId);
    return links.map((l) => this.deps.oauthAccountMapper.toDTO(l));
  }

  async unlinkAccount(userId: string, provider: OAuthProviderName): Promise<boolean> {
    await this.deps.unlinkOAuthAccountUseCase.execute({ userId, provider });
    return true;
  }

  async exchangeMobileCode(code: string, codeVerifier: string): Promise<MobileOAuthTokens> {
    return this.deps.exchangeMobileOAuthCodeUseCase.execute({ code, codeVerifier });
  }
}
