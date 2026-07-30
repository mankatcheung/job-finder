export interface LlmKeyStatus {
  configured: boolean;
  provider: string | null;
}

export interface IGetLlmKeyStatusUseCase {
  execute(userId: string): Promise<LlmKeyStatus>;
}
