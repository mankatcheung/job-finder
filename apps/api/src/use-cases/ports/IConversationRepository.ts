import type { Conversation } from '#src/domain/conversation/Conversation.js';

export interface CreateConversationData {
  id: string;
  userId: string;
}

export interface IConversationRepository {
  create(data: CreateConversationData): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  /** Newest-updated first, for the conversation list/sidebar. */
  findAllByUserId(userId: string): Promise<Conversation[]>;
  updateTitle(id: string, title: string): Promise<void>;
  delete(id: string): Promise<void>;
}
