import { asClass, Lifetime, type NameAndRegistrationPair } from 'awilix';

import { RegisterPushSubscriptionUseCase } from '#src/use-cases/push/RegisterPushSubscriptionUseCase.js';
import { RegisterExpoPushTokenUseCase } from '#src/use-cases/push/RegisterExpoPushTokenUseCase.js';
import { UnregisterPushSubscriptionUseCase } from '#src/use-cases/push/UnregisterPushSubscriptionUseCase.js';
import { SendPushNotificationsUseCase } from '#src/use-cases/push/SendPushNotificationsUseCase.js';
import { SendFollowUpRemindersUseCase } from '#src/use-cases/reminders/SendFollowUpRemindersUseCase.js';

import type { Cradle } from '../types.js';

export const push = {
  registerPushSubscriptionUseCase: asClass(RegisterPushSubscriptionUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  registerExpoPushTokenUseCase: asClass(RegisterExpoPushTokenUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  unregisterPushSubscriptionUseCase: asClass(UnregisterPushSubscriptionUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  sendPushNotificationsUseCase: asClass(SendPushNotificationsUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
  sendFollowUpRemindersUseCase: asClass(SendFollowUpRemindersUseCase, {
    lifetime: Lifetime.TRANSIENT,
  }),
} satisfies NameAndRegistrationPair<Cradle>;
