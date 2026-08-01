import type { Conversation } from '#src/domain/conversation/Conversation.js';

export interface IListConversationsUseCase {
  execute(userId: string): Promise<Conversation[]>;
}
