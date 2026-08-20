import { ERROR_CODES } from '#src/constants.js';

/**
 * How a use case says something went wrong.
 *
 * Carries a code and nothing else. The equivalents under `http/errors` also
 * carry an HTTP status, which is why importing those here put `404` inside a
 * business rule — a use case has no opinion on how a transport reports it.
 *
 * `http/errors/formatError` maps the code to a status at the boundary, which
 * is the only place that knows there is a boundary. Adding a case here means
 * adding one to `fromCodedError` too, or it degrades to a 500.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** The thing asked for does not exist, or does not belong to this user. */
export class NotFoundError extends DomainError {
  constructor(resource = 'Resource') {
    // Callers pass either a noun ("Skill") or a whole sentence, and both read
    // the same way to whoever ends up seeing it.
    const message = /not found$/i.test(resource) ? resource : `${resource} not found`;
    super(message, ERROR_CODES.NOT_FOUND);
  }
}

/** The thing exists; this user may not do that to it. */
export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super(message, ERROR_CODES.FORBIDDEN);
  }
}

/** The request conflicts with something already there. */
export class ConflictError extends DomainError {
  constructor(message = 'Conflict') {
    super(message, ERROR_CODES.CONFLICT);
  }
}

/** The caller is not authenticated, or their credential no longer stands. */
export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, ERROR_CODES.UNAUTHORIZED);
  }
}

/** The input is malformed or fails a rule the caller can fix. */
export class ValidationError extends DomainError {
  constructor(message = 'Invalid input') {
    super(message, ERROR_CODES.VALIDATION);
  }
}

/** The caller is doing something too often. */
export class RateLimitedError extends DomainError {
  constructor(message = 'Too many requests') {
    super(message, ERROR_CODES.RATE_LIMITED);
  }
}

/** The action needs a fresh authentication before it will be allowed. */
export class StepUpRequiredError extends DomainError {
  constructor(message = 'Re-authentication required') {
    super(message, ERROR_CODES.STEP_UP_REQUIRED);
  }
}

/** No email matches. Distinct from NotFoundError so the sign-in page can say so. */
export class UserNotFoundError extends DomainError {
  constructor(message = 'No account found with this email') {
    super(message, ERROR_CODES.USER_NOT_FOUND);
  }
}

/** The user has not configured an AI provider. */
export class AiNotConfiguredError extends DomainError {
  constructor(message = 'AI is not configured') {
    super(message, ERROR_CODES.AI_NOT_CONFIGURED);
  }
}

/** The model replied with something unusable. */
export class AiResponseInvalidError extends DomainError {
  constructor(message = 'The AI response could not be used') {
    super(message, ERROR_CODES.AI_RESPONSE_INVALID);
  }
}

/** A dependency this action needs is unavailable. */
export class ServiceUnavailableError extends DomainError {
  constructor(message = 'Service unavailable') {
    super(message, ERROR_CODES.SERVICE_UNAVAILABLE);
  }
}
