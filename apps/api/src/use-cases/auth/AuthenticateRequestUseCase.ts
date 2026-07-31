import { API_TOKEN, API_TOKEN_SCOPE } from '#src/constants.js';
import type { ITokenService } from '#src/use-cases/ports/ITokenService.js';
import type { ValidateApiTokenUseCase } from '#src/use-cases/apiTokens/ValidateApiTokenUseCase.js';

export interface AuthenticateRequestResult {
  sub: string;
  email: string;
  sid?: string;
}

interface Deps {
  tokenService: ITokenService;
  validateApiTokenUseCase: ValidateApiTokenUseCase;
}

/**
 * Authenticates a raw access token — either a JWT (cookie/Bearer from login)
 * or an API token (`jfat_...` Bearer for programmatic access).
 *
 * Only FULL-scoped API tokens are accepted; READ-scoped tokens are MCP-only.
 * Returns null for any invalid, expired, or insufficiently-scoped token.
 */
export class AuthenticateRequestUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<AuthenticateRequestResult | null> {
    if (rawToken.startsWith(API_TOKEN.PREFIX)) {
      try {
        const result = await this.deps.validateApiTokenUseCase.execute(rawToken);
        if (result && result.scope === API_TOKEN_SCOPE.FULL) {
          return { sub: result.sub, email: result.email };
        }
        return null;
      } catch {
        return null;
      }
    }

    // JWT path
    try {
      return this.deps.tokenService.verifyAccess(rawToken);
    } catch {
      return null;
    }
  }
}
