/**
 * MCP server identity and JSON-RPC framing.
 *
 * Presentation contract for the MCP surface, so it sits with `McpController`
 * rather than in the use-case layer — same reasoning as `toolCatalogue.ts`
 * (JEF-177). Split out of the root-level `src/constants.ts` by JEF-253.
 */

/** MCP (Model Context Protocol) server identity and JSON-RPC framing. */
export const MCP = {
  JSONRPC_VERSION: '2.0',
  PROTOCOL_VERSION: '2024-11-05',
  SERVER_NAME: 'trakwyn-mcp',
  SERVER_VERSION: '1.0.0',
  SCOPES: ['read', 'full'] as const,
} as const;

/**
 * JSON-RPC 2.0 error codes.
 * @see https://www.jsonrpc.org/specification#error_object
 */
export const JSON_RPC_ERROR = {
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;
