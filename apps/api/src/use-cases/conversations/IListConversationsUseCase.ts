import type { Conversation } from '#src/domain/conversation/Conversation.js';

export interface IListConversationsUseCase {
  /** `limit` bounds the fetch; omit it to return the user's full history. */
  execute(userId: string, limit?: number): Promise<Conversation[]>;
}
