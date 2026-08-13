import { asValue, type NameAndRegistrationPair } from 'awilix';

import { RateLimiter } from '#src/infrastructure/rateLimit/RateLimiter.js';
import { RATE_LIMIT } from '#src/constants.js';

import type { Cradle } from './types.js';

export const rateLimiters = {
  passwordResetRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.PASSWORD_RESET_REQUEST.MAX_ATTEMPTS,
      RATE_LIMIT.PASSWORD_RESET_REQUEST.WINDOW_MS,
    ),
  ),
  totpRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.TOTP_VERIFICATION.MAX_ATTEMPTS,
      RATE_LIMIT.TOTP_VERIFICATION.WINDOW_MS,
    ),
  ),
  chatRateLimiter: asValue(
    new RateLimiter(RATE_LIMIT.CHAT_MESSAGE.MAX_ATTEMPTS, RATE_LIMIT.CHAT_MESSAGE.WINDOW_MS),
  ),
  generateCoverLetterRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.GENERATE_COVER_LETTER.MAX_ATTEMPTS,
      RATE_LIMIT.GENERATE_COVER_LETTER.WINDOW_MS,
    ),
  ),
  parseJobDescriptionRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.PARSE_JOB_DESCRIPTION.MAX_ATTEMPTS,
      RATE_LIMIT.PARSE_JOB_DESCRIPTION.WINDOW_MS,
    ),
  ),
  computeResumeMatchScoreRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.COMPUTE_RESUME_MATCH_SCORE.MAX_ATTEMPTS,
      RATE_LIMIT.COMPUTE_RESUME_MATCH_SCORE.WINDOW_MS,
    ),
  ),
  generateCompanyBriefingRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.GENERATE_COMPANY_BRIEFING.MAX_ATTEMPTS,
      RATE_LIMIT.GENERATE_COMPANY_BRIEFING.WINDOW_MS,
    ),
  ),
  updatePasswordRateLimiter: asValue(
    new RateLimiter(RATE_LIMIT.UPDATE_PASSWORD.MAX_ATTEMPTS, RATE_LIMIT.UPDATE_PASSWORD.WINDOW_MS),
  ),
  requestEmailChangeRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.REQUEST_EMAIL_CHANGE.MAX_ATTEMPTS,
      RATE_LIMIT.REQUEST_EMAIL_CHANGE.WINDOW_MS,
    ),
  ),
  requestAddBackupEmailRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.REQUEST_ADD_BACKUP_EMAIL.MAX_ATTEMPTS,
      RATE_LIMIT.REQUEST_ADD_BACKUP_EMAIL.WINDOW_MS,
    ),
  ),
  backupEmailRecoveryRateLimiter: asValue(
    new RateLimiter(
      RATE_LIMIT.BACKUP_EMAIL_RECOVERY.MAX_ATTEMPTS,
      RATE_LIMIT.BACKUP_EMAIL_RECOVERY.WINDOW_MS,
    ),
  ),
} satisfies NameAndRegistrationPair<Cradle>;
