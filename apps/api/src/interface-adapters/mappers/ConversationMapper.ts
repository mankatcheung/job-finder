import type { Conversation } from '#src/domain/conversation/Conversation.js';

export type ConversationDTO = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export class ConversationMapper {
  toDTO(conversation: Conversation): ConversationDTO {
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }
}
