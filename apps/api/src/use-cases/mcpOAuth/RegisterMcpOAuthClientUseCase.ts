import { randomBytes } from 'node:crypto';
import { MCP_OAUTH } from '#src/constants.js';
import type { McpOAuthClient } from '#src/domain/mcpOAuth/McpOAuthClient.js';
import type { IMcpOAuthClientRepository } from '#src/use-cases/ports/IMcpOAuthClientRepository.js';

interface Deps {
  mcpOAuthClientRepository: IMcpOAuthClientRepository;
}

export interface RegisterMcpOAuthClientInput {
  name: string;
  redirectUris: string[];
}

export class RegisterMcpOAuthClientUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterMcpOAuthClientInput): Promise<McpOAuthClient> {
    const name = input.name.trim();
    const redirectUris = [...new Set(input.redirectUris.map((uri) => uri.trim()))];
    if (!name || name.length > 100) {
      throw new Error('client_name must be between 1 and 100 characters');
    }
    if (redirectUris.length === 0 || redirectUris.some((uri) => !isAllowedRedirectUri(uri))) {
      throw new Error('redirect_uris must contain valid exact HTTP(S) URLs');
    }

    const id = `${MCP_OAUTH.CLIENT_ID_PREFIX}${randomBytes(
      MCP_OAUTH.CLIENT_ID_RANDOM_BYTES,
    ).toString('hex')}`;
    return this.deps.mcpOAuthClientRepository.create({ id, name, redirectUris });
  }
}

function isAllowedRedirectUri(value: string): boolean {
  try {
    const uri = new URL(value);
    return uri.protocol === 'https:' || (uri.protocol === 'http:' && isLoopback(uri.hostname));
  } catch {
    return false;
  }
}

function isLoopback(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}
