import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type { IListConversationsUseCase } from '#src/use-cases/conversations/IListConversationsUseCase.js';

interface Deps {
  conversationRepository: IConversationRepository;
}

export class ListConversationsUseCase implements IListConversationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<Conversation[]> {
    return this.deps.conversationRepository.findAllByUserId(userId);
  }
}
