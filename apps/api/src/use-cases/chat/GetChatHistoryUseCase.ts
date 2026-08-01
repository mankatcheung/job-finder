import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type { Message } from '#src/domain/message/Message.js';
import type { IGetChatHistoryUseCase } from '#src/use-cases/chat/IGetChatHistoryUseCase.js';

interface Deps {
  messageRepository: IMessageRepository;
}

export class GetChatHistoryUseCase implements IGetChatHistoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<Message[]> {
    return this.deps.messageRepository.findAllByUserId(userId);
  }
}
