import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitedError,
  fromCodedError,
} from '#src/http/errors/AppError.js';
import { ERROR_CODES } from '#src/constants.js';

describe('AppError', () => {
  it('sets message, statusCode, code, and name', () => {
    const err = new AppError('Something broke', 418, 'TEAPOT');

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Something broke');
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.name).toBe('AppError');
  });
});

describe('NotFoundError', () => {
  it('defaults to "Resource not found" with a 404 status and NOT_FOUND code', () => {
    const err = new NotFoundError();

    expect(err.message).toBe('Resource not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it('includes the given resource name in the message', () => {
    const err = new NotFoundError('Application');
    expect(err.message).toBe('Application not found');
  });
});

describe('ConflictError', () => {
  it('defaults to "Conflict" with a 409 status and CONFLICT code', () => {
    const err = new ConflictError();

    expect(err.message).toBe('Conflict');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe(ERROR_CODES.CONFLICT);
  });

  it('uses the given message when provided', () => {
    expect(new ConflictError('Email already in use').message).toBe('Email already in use');
  });
});

describe('UnauthorizedError', () => {
  it('defaults to "Unauthorized" with a 401 status and UNAUTHORIZED code', () => {
    const err = new UnauthorizedError();

    expect(err.message).toBe('Unauthorized');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });
});

describe('ForbiddenError', () => {
  it('defaults to "Forbidden" with a 403 status and FORBIDDEN code', () => {
    const err = new ForbiddenError();

    expect(err.message).toBe('Forbidden');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(ERROR_CODES.FORBIDDEN);
  });
});

describe('ValidationError', () => {
  it('defaults to "Invalid input" with a 400 status and VALIDATION code', () => {
    const err = new ValidationError();

    expect(err.message).toBe('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe(ERROR_CODES.VALIDATION);
  });

  it('uses the given message when provided', () => {
    expect(new ValidationError('Invalid import file').message).toBe('Invalid import file');
    expect(new ValidationError('Invalid timezone').message).toBe('Invalid timezone');
  });
});

describe('RateLimitedError', () => {
  it('defaults to "Too many requests" with a 429 status and RATE_LIMITED code', () => {
    const err = new RateLimitedError();

    expect(err.message).toBe('Too many requests');
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe(ERROR_CODES.RATE_LIMITED);
  });

  it('uses the given message when provided', () => {
    expect(new RateLimitedError('Slow down').message).toBe('Slow down');
    expect(new RateLimitedError('Too many password reset requests').message).toBe(
      'Too many password reset requests',
    );
  });
});

describe('fromCodedError', () => {
  it('returns the same instance when already an AppError', () => {
    const original = new ConflictError('Already exists');
    expect(fromCodedError(original)).toBe(original);
  });

  it.each([
    [ERROR_CODES.CONFLICT, ConflictError],
    [ERROR_CODES.UNAUTHORIZED, UnauthorizedError],
    [ERROR_CODES.FORBIDDEN, ForbiddenError],
    [ERROR_CODES.VALIDATION, ValidationError],
    [ERROR_CODES.RATE_LIMITED, RateLimitedError],
  ])('maps a %s-coded Error to a %s, preserving the message', (code, ExpectedClass) => {
    const raw = Object.assign(new Error('Domain-specific message'), { code });

    const result = fromCodedError(raw);

    expect(result).toBeInstanceOf(ExpectedClass);
    expect(result.message).toBe('Domain-specific message');
    expect(result.code).toBe(code);
  });

  it('maps a NOT_FOUND-coded Error to a NotFoundError', () => {
    // NotFoundError's constructor takes a *resource name*, not a full message
    // (it appends " not found" itself) — but fromCodedError passes the raw
    // error message straight into it, so the result reads oddly (a doubled
    // suffix) rather than preserving the original message verbatim like the
    // other three branches do. Documenting the actual behavior here rather
    // than the behavior one might expect by analogy with Conflict/Unauthorized/Forbidden.
    const raw = Object.assign(new Error('Domain-specific message'), {
      code: ERROR_CODES.NOT_FOUND,
    });

    const result = fromCodedError(raw);

    expect(result).toBeInstanceOf(NotFoundError);
    expect(result.message).toBe('Domain-specific message not found');
    expect(result.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it('falls back to a generic 500 INTERNAL_ERROR for an Error with no code', () => {
    const result = fromCodedError(new Error('boom'));

    expect(result.message).toBe('Internal server error');
    expect(result.statusCode).toBe(500);
    expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('falls back to a generic 500 INTERNAL_ERROR for an Error with an unrecognized code', () => {
    const raw = Object.assign(new Error('boom'), { code: 'SOME_OTHER_CODE' });

    const result = fromCodedError(raw);

    expect(result.statusCode).toBe(500);
    expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('falls back to a generic 500 INTERNAL_ERROR for a non-Error value', () => {
    const result = fromCodedError('just a string');

    expect(result.message).toBe('Internal server error');
    expect(result.statusCode).toBe(500);
    expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('never leaks the original message for uncoded errors', () => {
    const result = fromCodedError(new Error('leaked internal detail: connection string xyz'));
    expect(result.message).not.toContain('leaked internal detail');
  });
});
