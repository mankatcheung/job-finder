import { API_TOKEN } from '#src/constants.js';
import type { ApiTokenScope } from '#src/domain/apiToken/ApiToken.js';
import type { ValidateApiTokenUseCase } from '#src/use-cases/apiTokens/ValidateApiTokenUseCase.js';

export interface AuthenticateMcpRequestResult {
  sub: string;
  /**
   * The token's scope, carried through so the caller can gate write tools
   * (JEF-176). Both scopes reach MCP — that's what lets a read-only token be
   * useful here — so "authenticated" is not the same as "may mutate".
   */
  scope: ApiTokenScope;
}

interface Deps {
  validateApiTokenUseCase: ValidateApiTokenUseCase;
}

/**
 * Authenticates an MCP request's Bearer API token (`trakwyn_...`).
 *
 * Accepts any scope (FULL or READ) — unlike GraphQL which requires FULL —
 * and returns it, so write tools can be refused to READ tokens.
 * Rejects JWTs and any other non-API-token credentials.
 * Returns null for invalid, expired, or non-API tokens.
 */
export class AuthenticateMcpRequestUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<AuthenticateMcpRequestResult | null> {
    if (!rawToken.startsWith(API_TOKEN.PREFIX)) return null;

    try {
      const result = await this.deps.validateApiTokenUseCase.execute(rawToken);
      return result ? { sub: result.sub, scope: result.scope } : null;
    } catch {
      return null;
    }
  }
}
