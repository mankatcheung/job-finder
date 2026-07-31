import { API_TOKEN } from '#src/constants.js';
import type { ValidateApiTokenUseCase } from '#src/use-cases/apiTokens/ValidateApiTokenUseCase.js';

export interface AuthenticateMcpRequestResult {
  sub: string;
}

interface Deps {
  validateApiTokenUseCase: ValidateApiTokenUseCase;
}

/**
 * Authenticates an MCP request's Bearer API token (`jfat_...`).
 *
 * Accepts any scope (FULL or READ) — unlike GraphQL which requires FULL.
 * Rejects JWTs and any other non-API-token credentials.
 * Returns null for invalid, expired, or non-API tokens.
 */
export class AuthenticateMcpRequestUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<AuthenticateMcpRequestResult | null> {
    if (!rawToken.startsWith(API_TOKEN.PREFIX)) return null;

    try {
      const result = await this.deps.validateApiTokenUseCase.execute(rawToken);
      return result ? { sub: result.sub } : null;
    } catch {
      return null;
    }
  }
}
