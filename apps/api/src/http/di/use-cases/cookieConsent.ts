import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { RecordCookieConsentUseCase } from '#src/use-cases/cookieConsent/RecordCookieConsentUseCase.js';

import type { Cradle } from '../types.js';

export const cookieConsent = {
  recordCookieConsentUseCase: asClass(RecordCookieConsentUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
