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
  /**
   * Newest-updated first, for the conversation list/sidebar. `limit` bounds
   * the fetch for surfaces that only show a window (the assistant sidebar);
   * omitting it returns the user's full history.
   */
  findAllByUserId(userId: string, limit?: number): Promise<Conversation[]>;
  /**
   * Newest-updated first. Matches `searchTerm` against conversation titles
   * and message contents; `%` and `_` inside the term are matched literally.
   */
  searchByUserId(userId: string, searchTerm: string): Promise<Conversation[]>;
  updateTitle(id: string, title: string): Promise<void>;
  /** Locks in the provider/model on first use when not chosen at creation time. */
  updateLlmSettings(id: string, llmProvider: string, llmModel: string | null): Promise<void>;
  delete(id: string): Promise<void>;
}
