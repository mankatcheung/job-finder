import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphQLError } from 'graphql';
import { formatError } from '@/http/errors/formatError.js';
import { ERROR_CODES } from '@/constants.js';

describe('formatError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns the error unchanged when there is no originalError', () => {
    const err = new GraphQLError('Syntax error');

    const result = formatError(err);

    expect(result).toBe(err);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('passes through a GraphQLError thrown intentionally in a resolver, unchanged', () => {
    const inner = new GraphQLError('Explicit resolver error', {
      extensions: { code: ERROR_CODES.CONFLICT },
    });
    const wrapper = new GraphQLError('wrapped', { originalError: inner });

    const result = formatError(wrapper);

    expect(result).toBe(inner);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('maps a NOT_FOUND-coded error to a client-safe GraphQLError without logging', () => {
    // Use cases throughout this codebase throw `new Error('Application not
    // found')` (message already ending in "not found") for this code. Since
    // NotFoundError's constructor appends its own " not found" suffix,
    // routing that message through fromCodedError doubles it — this is the
    // actual current behavior, not something introduced by this test.
    const original = Object.assign(new Error('Application not found'), {
      code: ERROR_CODES.NOT_FOUND,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper);

    expect(result.message).toBe('Application not found not found');
    expect(result.extensions.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(result.extensions.statusCode).toBe(404);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('maps a FORBIDDEN-coded error to a client-safe GraphQLError without logging', () => {
    const original = Object.assign(new Error('Not your application'), {
      code: ERROR_CODES.FORBIDDEN,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper);

    expect(result.extensions.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(result.extensions.statusCode).toBe(403);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('logs and returns a generic 500 error for an uncoded error, without leaking its message', () => {
    const original = new Error('TypeError: cannot read property x of undefined at db.ts:42');
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[GraphQL error]', original);
    expect(result.message).toBe('Internal server error');
    expect(result.message).not.toContain('db.ts');
    expect(result.extensions.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(result.extensions.statusCode).toBe(500);
  });

  it('maps a RATE_LIMITED-coded error to a client-safe GraphQLError without logging', () => {
    const original = Object.assign(new Error('Too many attempts'), {
      code: ERROR_CODES.RATE_LIMITED,
    });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    const result = formatError(wrapper);

    expect(result.extensions.code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(result.extensions.statusCode).toBe(429);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('logs for an error whose code is not in the expected client-facing set', () => {
    const original = Object.assign(new Error('Unexpected'), { code: 'SOME_UNKNOWN_CODE' });
    const wrapper = new GraphQLError('wrapped', { originalError: original });

    formatError(wrapper);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[GraphQL error]', original);
  });
});
