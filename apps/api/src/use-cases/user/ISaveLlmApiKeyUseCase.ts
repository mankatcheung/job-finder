export interface SaveLlmApiKeyInput {
  userId: string;
  provider: string;
  apiKey: string;
  /** Optional model override for named providers; required when provider is 'custom'. */
  model?: string | null;
  /** Base URL; only valid (and required) when provider is 'custom'. */
  baseUrl?: string | null;
}

export interface ISaveLlmApiKeyUseCase {
  execute(input: SaveLlmApiKeyInput): Promise<void>;
}
