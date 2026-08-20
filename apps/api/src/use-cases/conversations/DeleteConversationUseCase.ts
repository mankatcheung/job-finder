import { ForbiddenError, NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
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
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    await this.deps.conversationRepository.delete(input.conversationId);
  }
}
