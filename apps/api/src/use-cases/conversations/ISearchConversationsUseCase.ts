import type { Conversation } from '#src/domain/conversation/Conversation.js';

export interface ISearchConversationsUseCase {
  execute(userId: string, searchTerm: string): Promise<Conversation[]>;
}
