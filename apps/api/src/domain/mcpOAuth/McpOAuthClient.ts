export interface McpOAuthClient {
  id: string;
  name: string;
  redirectUris: string[];
  revokedAt: Date | null;
  createdAt: Date;
}
