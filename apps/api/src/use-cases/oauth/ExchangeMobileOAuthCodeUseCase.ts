import { UnauthorizedError } from '#src/use-cases/errors/DomainError.js';
import type { IMobileOAuthHandoffService } from '#src/use-cases/ports/IMobileOAuthHandoffService.js';
import type {
  ExchangeMobileOAuthCodeInput,
  IExchangeMobileOAuthCodeUseCase,
} from '#src/use-cases/oauth/IExchangeMobileOAuthCodeUseCase.js';
import type { MobileOAuthTokens } from '#src/use-cases/ports/IMobileOAuthHandoffService.js';

interface Deps {
  mobileOAuthHandoffService: IMobileOAuthHandoffService;
}

export class ExchangeMobileOAuthCodeUseCase implements IExchangeMobileOAuthCodeUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ExchangeMobileOAuthCodeInput): Promise<MobileOAuthTokens> {
    try {
      return this.deps.mobileOAuthHandoffService.verify(input.code);
    } catch {
      // The signature/expiry error is infra detail (see MobileOAuthHandoffService) —
      // to the client this is just "that code doesn't work any more".
      throw new UnauthorizedError('Invalid or expired OAuth handoff code');
    }
  }
}
