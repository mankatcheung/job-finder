import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { Message } from '#src/domain/message/Message.js';
import { ERROR_CODES } from '#src/constants.js';
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
      throw Object.assign(new Error('Conversation not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (conversation.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    return this.deps.messageRepository.findAllByConversationId(input.conversationId);
  }
}
