import { GraphQLError } from 'graphql';
import { fromCodedError } from '@/http/errors/AppError.js';

export function formatError(err: GraphQLError): GraphQLError {
  const original = err.originalError;
  if (!original) return err;

  // GraphQLErrors thrown intentionally in resolvers pass through unchanged
  if (original instanceof GraphQLError) return original;

  // Log unexpected infrastructure errors server-side
  const coded = (original as { code?: string }).code;
  if (!coded || !['NOT_FOUND', 'CONFLICT', 'UNAUTHORIZED', 'FORBIDDEN'].includes(coded)) {
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
