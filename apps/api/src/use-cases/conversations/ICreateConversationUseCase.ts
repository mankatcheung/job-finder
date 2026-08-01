import type { Conversation } from '#src/domain/conversation/Conversation.js';

export interface ICreateConversationUseCase {
  execute(userId: string): Promise<Conversation>;
}
