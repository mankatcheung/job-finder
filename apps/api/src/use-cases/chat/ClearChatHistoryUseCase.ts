import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type { IClearChatHistoryUseCase } from '#src/use-cases/chat/IClearChatHistoryUseCase.js';

interface Deps {
  messageRepository: IMessageRepository;
}

export class ClearChatHistoryUseCase implements IClearChatHistoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<void> {
    await this.deps.messageRepository.deleteAllByUserId(userId);
  }
}
