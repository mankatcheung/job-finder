export interface DeleteConversationInput {
  userId: string;
  conversationId: string;
}

export interface IDeleteConversationUseCase {
  execute(input: DeleteConversationInput): Promise<void>;
}
