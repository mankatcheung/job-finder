import type { Message, MessageRole } from '#src/domain/message/Message.js';

export interface CreateMessageData {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
}

export interface IMessageRepository {
  create(data: CreateMessageData): Promise<Message>;
  findAllByConversationId(conversationId: string): Promise<Message[]>;
}
