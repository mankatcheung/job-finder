export interface SaveLlmApiKeyInput {
  userId: string;
  provider: string;
  apiKey: string;
}

export interface ISaveLlmApiKeyUseCase {
  execute(input: SaveLlmApiKeyInput): Promise<void>;
}
