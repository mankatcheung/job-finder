import type { McpOAuthClient } from '#src/domain/mcpOAuth/McpOAuthClient.js';

export interface CreateMcpOAuthClientData {
  id: string;
  name: string;
  redirectUris: string[];
}

export interface IMcpOAuthClientRepository {
  create(data: CreateMcpOAuthClientData): Promise<McpOAuthClient>;
  findById(id: string): Promise<McpOAuthClient | null>;
}
