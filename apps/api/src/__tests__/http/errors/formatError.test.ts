import { describe, it, expect } from 'vitest';
import { GraphQLError } from 'graphql';
import { formatError } from '#src/http/errors/formatError.js';
import { makeLogger } from '#src/__tests__/helpers/mocks/infrastructure.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

describe('formatError', () => {
  it('returns the error unchanged when there is no originalError', () => {
    const logger = makeLogger();
    const err = new GraphQLError('Syntax error');

    const result = formatError(err, logger);

    expect(result).toBe(err);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('passes through a GraphQLError thrown intentionally in a resolver, unchanged', () => {
    const logger = makeLogger();
    const inner = new GraphQLError('Explicit resolver error', {
      extensions: { code: ERROR_CODES.CONFLICT },
    });
    const wrapper = new GraphQLError('wrapped', { originalError: inner });

    const result = formatError(wrapper, logger);

    expect(result).toBe(inner);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps a NOT_FOUND-coded error to a client-safe GraphQLError without logging', () => {
    const logger = makeLogger();
    // Use cases throughout this codebase throw `new Error('Application not
    // found')` (message already ending in "not found") for this code.
    // NotFoundError must not double-append its own " not found" suffix here.
    const original = Object.assign(new Error('Application not found'), {
      code: ERROR_CODES.NOT_FOUND,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper, logger);

    expect(result.message).toBe('Application not found');
    expect(result.extensions.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(result.extensions.statusCode).toBe(404);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('appends " not found" for a NOT_FOUND-coded error whose message does not already end with it', () => {
    const logger = makeLogger();
    const original = Object.assign(new Error('Application'), {
      code: ERROR_CODES.NOT_FOUND,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper, logger);

    expect(result.message).toBe('Application not found');
    expect(result.extensions.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(result.extensions.statusCode).toBe(404);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps a FORBIDDEN-coded error to a client-safe GraphQLError without logging', () => {
    const logger = makeLogger();
    const original = Object.assign(new Error('Not your application'), {
      code: ERROR_CODES.FORBIDDEN,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper, logger);

    expect(result.extensions.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(result.extensions.statusCode).toBe(403);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps a RATE_LIMITED-coded error to a client-safe GraphQLError without logging', () => {
    const logger = makeLogger();
    const original = Object.assign(new Error('Too many password reset requests'), {
      code: ERROR_CODES.RATE_LIMITED,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper, logger);

    expect(result.extensions.code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(result.extensions.statusCode).toBe(429);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps a QUOTA_EXCEEDED-coded error to a client-safe conflict', () => {
    const logger = makeLogger();
    const original = Object.assign(new Error('You have reached the maximum of 50 applications'), {
      code: ERROR_CODES.QUOTA_EXCEEDED,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper, logger);

    expect(result.message).toBe('You have reached the maximum of 50 applications');
    expect(result.extensions.code).toBe(ERROR_CODES.QUOTA_EXCEEDED);
    expect(result.extensions.statusCode).toBe(409);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and returns a generic 500 error for an uncoded error, without leaking its message', () => {
    const logger = makeLogger();
    const original = new Error('TypeError: cannot read property x of undefined at db.ts:42');
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper, logger);

    expect(logger.error).toHaveBeenCalledWith('[GraphQL error]', original);
    expect(result.message).toBe('Internal server error');
    expect(result.message).not.toContain('db.ts');
    expect(result.extensions.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(result.extensions.statusCode).toBe(500);
  });

  it('logs for an error whose code is not in the expected client-facing set', () => {
    const logger = makeLogger();
    const original = Object.assign(new Error('Unexpected'), { code: 'SOME_UNKNOWN_CODE' });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    formatError(wrapper, logger);

    expect(logger.error).toHaveBeenCalledWith('[GraphQL error]', original);
  });
});
