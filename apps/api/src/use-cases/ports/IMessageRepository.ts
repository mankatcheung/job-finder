import type { Message, MessageRole } from '#src/domain/message/Message.js';

export interface CreateMessageData {
  id: string;
  userId: string;
  role: MessageRole;
  content: string;
}

export interface IMessageRepository {
  create(data: CreateMessageData): Promise<Message>;
  findAllByUserId(userId: string): Promise<Message[]>;
  deleteAllByUserId(userId: string): Promise<void>;
}
