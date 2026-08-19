import { asValue, type NameAndRegistrationPair } from 'awilix';

import { RateLimiter } from '#src/infrastructure/rateLimit/RateLimiter.js';
import { RedisRateLimiter } from '#src/infrastructure/rateLimit/RedisRateLimiter.js';
import { getRedisClient } from '#src/infrastructure/cache/redisClient.js';
import { RATE_LIMIT } from '#src/constants.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';

import type { Cradle } from './types.js';

/**
 * Selects RedisRateLimiter vs. the in-memory RateLimiter using the same
 * CACHE_PROVIDER toggle RedisCache uses, reusing the same shared Redis
 * client instance (see getRedisClient) rather than opening a second
 * connection. See JEF-160: the in-memory limiter's buckets aren't shared
 * across serverless instances, so it doesn't actually limit anything under
 * normal horizontal scaling.
 */
function buildRateLimiter(maxAttempts: number, windowMs: number): IRateLimiter {
  const redis = getRedisClient();
  return redis
    ? new RedisRateLimiter({ redis, maxAttempts, windowMs })
    : new RateLimiter(maxAttempts, windowMs);
}

export const rateLimiters = {
  passwordResetRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.PASSWORD_RESET_REQUEST.MAX_ATTEMPTS,
      RATE_LIMIT.PASSWORD_RESET_REQUEST.WINDOW_MS,
    ),
  ),
  totpRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.TOTP_VERIFICATION.MAX_ATTEMPTS,
      RATE_LIMIT.TOTP_VERIFICATION.WINDOW_MS,
    ),
  ),
  chatRateLimiter: asValue(
    buildRateLimiter(RATE_LIMIT.CHAT_MESSAGE.MAX_ATTEMPTS, RATE_LIMIT.CHAT_MESSAGE.WINDOW_MS),
  ),
  generateCoverLetterRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.GENERATE_COVER_LETTER.MAX_ATTEMPTS,
      RATE_LIMIT.GENERATE_COVER_LETTER.WINDOW_MS,
    ),
  ),
  parseJobDescriptionRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.PARSE_JOB_DESCRIPTION.MAX_ATTEMPTS,
      RATE_LIMIT.PARSE_JOB_DESCRIPTION.WINDOW_MS,
    ),
  ),
  computeResumeMatchScoreRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.COMPUTE_RESUME_MATCH_SCORE.MAX_ATTEMPTS,
      RATE_LIMIT.COMPUTE_RESUME_MATCH_SCORE.WINDOW_MS,
    ),
  ),
  generateCompanyBriefingRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.GENERATE_COMPANY_BRIEFING.MAX_ATTEMPTS,
      RATE_LIMIT.GENERATE_COMPANY_BRIEFING.WINDOW_MS,
    ),
  ),
  updatePasswordRateLimiter: asValue(
    buildRateLimiter(RATE_LIMIT.UPDATE_PASSWORD.MAX_ATTEMPTS, RATE_LIMIT.UPDATE_PASSWORD.WINDOW_MS),
  ),
  requestEmailChangeRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.REQUEST_EMAIL_CHANGE.MAX_ATTEMPTS,
      RATE_LIMIT.REQUEST_EMAIL_CHANGE.WINDOW_MS,
    ),
  ),
  requestAddBackupEmailRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.REQUEST_ADD_BACKUP_EMAIL.MAX_ATTEMPTS,
      RATE_LIMIT.REQUEST_ADD_BACKUP_EMAIL.WINDOW_MS,
    ),
  ),
  // Was declared as a dependency by RemoveBackupEmailUseCase but never
  // actually registered here — Awilix would have thrown a resolution error
  // on every "remove backup email" mutation call. Found and fixed
  // incidentally while rewriting this file for JEF-160.
  removeBackupEmailRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.REMOVE_BACKUP_EMAIL.MAX_ATTEMPTS,
      RATE_LIMIT.REMOVE_BACKUP_EMAIL.WINDOW_MS,
    ),
  ),
  backupEmailRecoveryRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.BACKUP_EMAIL_RECOVERY.MAX_ATTEMPTS,
      RATE_LIMIT.BACKUP_EMAIL_RECOVERY.WINDOW_MS,
    ),
  ),
  mcpOAuthRegistrationRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.MCP_OAUTH_REGISTRATION.MAX_ATTEMPTS,
      RATE_LIMIT.MCP_OAUTH_REGISTRATION.WINDOW_MS,
    ),
  ),
  mcpOAuthAuthorizationRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.MCP_OAUTH_AUTHORIZATION.MAX_ATTEMPTS,
      RATE_LIMIT.MCP_OAUTH_AUTHORIZATION.WINDOW_MS,
    ),
  ),
  mcpOAuthTokenRateLimiter: asValue(
    buildRateLimiter(RATE_LIMIT.MCP_OAUTH_TOKEN.MAX_ATTEMPTS, RATE_LIMIT.MCP_OAUTH_TOKEN.WINDOW_MS),
  ),
  mcpOAuthRevocationRateLimiter: asValue(
    buildRateLimiter(
      RATE_LIMIT.MCP_OAUTH_REVOCATION.MAX_ATTEMPTS,
      RATE_LIMIT.MCP_OAUTH_REVOCATION.WINDOW_MS,
    ),
  ),
} satisfies NameAndRegistrationPair<Cradle>;
