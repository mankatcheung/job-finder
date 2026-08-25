import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type { IListConversationsUseCase } from '#src/use-cases/conversations/IListConversationsUseCase.js';

interface Deps {
  conversationRepository: IConversationRepository;
}

/**
 * Lists a user's conversations, newest-updated first. `limit` bounds the
 * result for surfaces that only show a window — the assistant sidebar shows
 * the ten most recent and must not pull the user's entire history (same
 * unbounded-fetch concern JEF-172 raised for MCP's list_applications).
 */
export class ListConversationsUseCase implements IListConversationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string, limit?: number): Promise<Conversation[]> {
    return this.deps.conversationRepository.findAllByUserId(userId, limit);
  }
}
