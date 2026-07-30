/** GraphQL error `extensions.code` values the frontend branches on. Mirrors apps/api's ERROR_CODES. */
export const AI_NOT_CONFIGURED_CODE = 'AI_NOT_CONFIGURED';

/**
 * Extracts the GraphQL `extensions.code` from a graphql-request error —
 * duck-typed rather than `instanceof ClientError` since tests throughout this
 * codebase mock rejections as plain `{ response: { errors: [...] } }` objects.
 */
export function getGqlErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined;
  const response = (error as { response?: { errors?: Array<{ extensions?: { code?: string } }> } })
    .response;
  return response?.errors?.[0]?.extensions?.code;
}
