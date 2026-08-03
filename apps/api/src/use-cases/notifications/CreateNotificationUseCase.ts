import type { INotificationRepository } from '#src/use-cases/ports/INotificationRepository.js';
import type {
  ICreateNotificationUseCase,
  CreateNotificationInput,
  CreateNotificationOutput,
} from '#src/use-cases/notifications/ICreateNotificationUseCase.js';

interface Deps {
  notificationRepository: INotificationRepository;
  generateId: () => string;
}

export class CreateNotificationUseCase implements ICreateNotificationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateNotificationInput): Promise<CreateNotificationOutput> {
    return this.deps.notificationRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url,
    });
  }
}
