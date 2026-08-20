import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { Message } from '#src/domain/message/Message.js';
import type {
  IGetChatHistoryUseCase,
  GetChatHistoryInput,
} from '#src/use-cases/chat/IGetChatHistoryUseCase.js';

interface Deps {
  messageRepository: IMessageRepository;
  conversationRepository: IConversationRepository;
}

export class GetChatHistoryUseCase implements IGetChatHistoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetChatHistoryInput): Promise<Message[]> {
    const conversation = await this.deps.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    return this.deps.messageRepository.findAllByConversationId(input.conversationId);
  }
}
