import type { Message } from '#src/domain/message/Message.js';

export interface IGetChatHistoryUseCase {
  execute(userId: string): Promise<Message[]>;
}
