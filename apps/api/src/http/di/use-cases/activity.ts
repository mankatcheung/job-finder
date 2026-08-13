import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { GetActivityLogsUseCase } from '#src/use-cases/activityLogs/GetActivityLogsUseCase.js';
import { GetResponseTimeAnalyticsUseCase } from '#src/use-cases/activityLogs/GetResponseTimeAnalyticsUseCase.js';
import { GetLoginHistoryUseCase } from '#src/use-cases/loginEvents/GetLoginHistoryUseCase.js';
import { GetSecurityActivityUseCase } from '#src/use-cases/securityEvents/GetSecurityActivityUseCase.js';

import type { Cradle } from '../types.js';

export const activity = {
  getActivityLogsUseCase: asClass(GetActivityLogsUseCase, { lifetime: Lifetime.TRANSIENT }),
  getResponseTimeAnalyticsUseCase: asClass(GetResponseTimeAnalyticsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getLoginHistoryUseCase: asClass(GetLoginHistoryUseCase, { lifetime: Lifetime.TRANSIENT }),
  getSecurityActivityUseCase: asClass(GetSecurityActivityUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
