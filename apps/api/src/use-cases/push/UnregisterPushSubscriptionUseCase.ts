import type { IPushSubscriptionRepository } from '#src/use-cases/ports/IPushSubscriptionRepository.js';

interface Deps {
  pushSubscriptionRepository: IPushSubscriptionRepository;
}

export interface UnregisterPushSubscriptionInput {
  endpoint: string;
}

export class UnregisterPushSubscriptionUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UnregisterPushSubscriptionInput): Promise<void> {
    await this.deps.pushSubscriptionRepository.deleteByEndpoint(input.endpoint);
  }
}
