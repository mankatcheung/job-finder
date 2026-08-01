export interface IClearChatHistoryUseCase {
  execute(userId: string): Promise<void>;
}
