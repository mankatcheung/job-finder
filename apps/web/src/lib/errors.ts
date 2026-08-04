import { ERROR_CODES } from '#/constants';

interface GraphQLErrorLike {
  response: {
    errors?: Array<{ message?: string; extensions?: { code?: string } }>;
  };
}

// Duck-typed rather than `instanceof ClientError`: graphql-request's real
// thrown errors are ClientError instances, but tests throughout this
// codebase mock rejections as plain `{ response: { errors: [...] } }`
// objects — matching that shape works for both.
function isGraphQLErrorLike(error: unknown): error is GraphQLErrorLike {
  return typeof error === 'object' && error !== null && 'response' in error;
}

// NOT_FOUND/FORBIDDEN get a fixed override: NOT_FOUND's raw message is just a
// terse "X not found" (not great copy), and FORBIDDEN's is always the bare
// word "Forbidden" with no context — a generic-but-friendlier message serves
// better than either. Every other coded error (CONFLICT, VALIDATION,
// RATE_LIMITED, UNAUTHORIZED — the last covers both "Invalid credentials" and
// "Invalid verification code" on the login/TOTP flows) already carries
// user-presentable prose from the use-case that threw it, so it's passed
// through as-is instead of being overridden here.
const CODE_MESSAGES: Record<string, string> = {
  [ERROR_CODES.USER_NOT_FOUND]: 'No account found with this email. Please register first.',
  [ERROR_CODES.NOT_FOUND]: "That item couldn't be found — it may have been deleted.",
  [ERROR_CODES.FORBIDDEN]: "You don't have permission to do that.",
};

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_MESSAGE = "Can't reach the server. Check your connection and try again.";

/**
 * Turns any thrown error (GraphQL, network, or otherwise) into a single
 * user-facing message — the one place that decides what to actually show,
 * instead of every call site re-deriving it (or not bothering to).
 */
export function getErrorMessage(error: unknown): string {
  console.error(error);

  if (isGraphQLErrorLike(error)) {
    const gqlError = error.response.errors?.[0];
    const code = gqlError?.extensions?.code as string | undefined;
    if (code && code in CODE_MESSAGES) return CODE_MESSAGES[code];
    if (code === ERROR_CODES.INTERNAL_ERROR || code === ERROR_CODES.SERVICE_UNAVAILABLE || !code) {
      return GENERIC_MESSAGE;
    }
    return gqlError?.message ?? GENERIC_MESSAGE;
  }

  if (error instanceof TypeError) return NETWORK_MESSAGE;

  return GENERIC_MESSAGE;
}
