import type { Message } from '#src/domain/message/Message.js';

export type MessageDTO = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export class MessageMapper {
  toDTO(message: Message): MessageDTO {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
