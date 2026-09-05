import type { MobileOAuthTokens } from '#src/use-cases/ports/IMobileOAuthHandoffService.js';

export interface ExchangeMobileOAuthCodeInput {
  code: string;
  codeVerifier: string;
}

export interface IExchangeMobileOAuthCodeUseCase {
  execute(input: ExchangeMobileOAuthCodeInput): Promise<MobileOAuthTokens>;
}
