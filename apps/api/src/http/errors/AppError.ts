import { ERROR_CODES } from '#src/constants.js';

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

export class ValidationError extends AppError {
  constructor(message = 'Invalid input') {
    super(message, 400, ERROR_CODES.VALIDATION);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, ERROR_CODES.RATE_LIMITED);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE);
  }
}

export class AiNotConfiguredError extends AppError {
  constructor(message = 'Add your AI API key in Settings to use this feature') {
    super(message, 400, ERROR_CODES.AI_NOT_CONFIGURED);
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
      case ERROR_CODES.VALIDATION:
        return new ValidationError(err.message);
      case ERROR_CODES.RATE_LIMITED:
        return new RateLimitedError(err.message);
      case ERROR_CODES.SERVICE_UNAVAILABLE:
        return new ServiceUnavailableError(err.message);
      case ERROR_CODES.AI_NOT_CONFIGURED:
        return new AiNotConfiguredError(err.message);
    }
  }
  return new AppError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
}
