import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { CreateNotificationUseCase } from '#src/use-cases/notifications/CreateNotificationUseCase.js';
import { GetNotificationsPageUseCase } from '#src/use-cases/notifications/GetNotificationsPageUseCase.js';
import { MarkNotificationsReadUseCase } from '#src/use-cases/notifications/MarkNotificationsReadUseCase.js';
import { GetUnreadNotificationCountUseCase } from '#src/use-cases/notifications/GetUnreadNotificationCountUseCase.js';

import type { Cradle } from '../types.js';

export const notifications = {
  createNotificationUseCase: asClass(CreateNotificationUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getNotificationsPageUseCase: asClass(GetNotificationsPageUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  markNotificationsReadUseCase: asClass(MarkNotificationsReadUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  getUnreadNotificationCountUseCase: asClass(GetUnreadNotificationCountUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
