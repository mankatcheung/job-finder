import type { IPushSubscriptionRepository } from '#src/use-cases/ports/IPushSubscriptionRepository.js';

interface Deps {
  pushSubscriptionRepository: IPushSubscriptionRepository;
  generateId: () => string;
}

export interface RegisterPushSubscriptionInput {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export class RegisterPushSubscriptionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterPushSubscriptionInput): Promise<void> {
    await this.deps.pushSubscriptionRepository.upsert({
      id: this.deps.generateId(),
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    });
  }
}
