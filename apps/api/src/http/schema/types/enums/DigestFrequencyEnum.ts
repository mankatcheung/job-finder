import { builder } from '#src/http/schema/builder.js';
import { DIGEST_FREQUENCY } from '#src/use-cases/constants.js';

export const DigestFrequencyEnum = builder.enumType('DigestFrequency', {
  values: {
    DAILY: { value: DIGEST_FREQUENCY.DAILY },
    WEEKLY: { value: DIGEST_FREQUENCY.WEEKLY },
    OFF: { value: DIGEST_FREQUENCY.OFF },
  },
});
