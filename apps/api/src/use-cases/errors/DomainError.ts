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
