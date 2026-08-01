import type { Conversation } from '#src/domain/conversation/Conversation.js';

export interface CreateConversationInput {
  userId: string;
  provider?: string | null;
  model?: string | null;
}

export interface ICreateConversationUseCase {
  execute(input: CreateConversationInput): Promise<Conversation>;
}
