export interface IClearLlmApiKeyUseCase {
  execute(userId: string): Promise<void>;
}
