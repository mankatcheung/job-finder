import type { Message } from '#src/domain/message/Message.js';

export interface GetChatHistoryInput {
  userId: string;
  conversationId: string;
}

export interface IGetChatHistoryUseCase {
  execute(input: GetChatHistoryInput): Promise<Message[]>;
}
