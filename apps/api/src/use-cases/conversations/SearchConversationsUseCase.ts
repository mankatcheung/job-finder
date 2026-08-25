import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type { ISearchConversationsUseCase } from '#src/use-cases/conversations/ISearchConversationsUseCase.js';

interface Deps {
  conversationRepository: IConversationRepository;
}

/**
 * Finds a user's conversations whose title or any message content matches
 * the search term, newest-updated first. The search runs server-side so
 * clients never need the full history to filter it locally. Blank terms are
 * rejected here rather than silently behaving as "list everything" — callers
 * that want that have the list query.
 */
export class SearchConversationsUseCase implements ISearchConversationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string, searchTerm: string): Promise<Conversation[]> {
    const trimmed = searchTerm.trim();
    if (!trimmed) return [];
    return this.deps.conversationRepository.searchByUserId(userId, trimmed);
  }
}
