export interface LlmKeyStatus {
  configured: boolean;
  provider: string | null;
  model: string | null;
  baseUrl: string | null;
}

export interface IGetLlmKeyStatusUseCase {
  execute(userId: string): Promise<LlmKeyStatus>;
}
