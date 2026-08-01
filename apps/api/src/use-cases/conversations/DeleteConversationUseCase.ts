import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import type {
  IDeleteConversationUseCase,
  DeleteConversationInput,
} from '#src/use-cases/conversations/IDeleteConversationUseCase.js';

interface Deps {
  conversationRepository: IConversationRepository;
}

export class DeleteConversationUseCase implements IDeleteConversationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteConversationInput): Promise<void> {
    const conversation = await this.deps.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw Object.assign(new Error('Conversation not found'), { code: ERROR_CODES.NOT_FOUND });
    }
    if (conversation.userId !== input.userId) {
      throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
    }

    await this.deps.conversationRepository.delete(input.conversationId);
  }
}
