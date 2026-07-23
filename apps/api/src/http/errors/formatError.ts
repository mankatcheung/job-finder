import { GraphQLError } from 'graphql';
import { fromCodedError } from '@/http/errors/AppError.js';
import { ERROR_CODES } from '@/constants.js';

// Expected client-facing error codes — these are not logged as server errors.
const EXPECTED_ERROR_CODES: string[] = [
  ERROR_CODES.NOT_FOUND,
  ERROR_CODES.CONFLICT,
  ERROR_CODES.UNAUTHORIZED,
  ERROR_CODES.FORBIDDEN,
  ERROR_CODES.RATE_LIMITED,
];

export function formatError(err: GraphQLError): GraphQLError {
  const original = err.originalError;
  if (!original) return err;

  // GraphQLErrors thrown intentionally in resolvers pass through unchanged
  if (original instanceof GraphQLError) return original;

  // Log unexpected infrastructure errors server-side
  const coded = (original as { code?: string }).code;
  if (!coded || !EXPECTED_ERROR_CODES.includes(coded)) {
    console.error('[GraphQL error]', original);
  }

  const appError = fromCodedError(original);
  return new GraphQLError(appError.message, {
    extensions: {
      code: appError.code,
      statusCode: appError.statusCode,
    },
  });
}
