import { ERROR_CODES } from '@/constants.js';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, ERROR_CODES.CONFLICT);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

export function fromCodedError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    const code = (err as Error & { code?: string }).code;
    switch (code) {
      case ERROR_CODES.NOT_FOUND:
        return new NotFoundError(err.message);
      case ERROR_CODES.CONFLICT:
        return new ConflictError(err.message);
      case ERROR_CODES.UNAUTHORIZED:
        return new UnauthorizedError(err.message);
      case ERROR_CODES.FORBIDDEN:
        return new ForbiddenError(err.message);
    }
  }
  return new AppError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
}
