import type { Conversation } from '#src/domain/conversation/Conversation.js';

export interface CreateConversationData {
  id: string;
  userId: string;
  llmProvider?: string | null;
  llmModel?: string | null;
}

export interface IConversationRepository {
  create(data: CreateConversationData): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  /** Newest-updated first, for the conversation list/sidebar. */
  findAllByUserId(userId: string): Promise<Conversation[]>;
  updateTitle(id: string, title: string): Promise<void>;
  /** Locks in the provider/model on first use when not chosen at creation time. */
  updateLlmSettings(id: string, llmProvider: string, llmModel: string | null): Promise<void>;
  delete(id: string): Promise<void>;
}
