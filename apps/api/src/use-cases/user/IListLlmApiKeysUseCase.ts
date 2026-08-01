import type { LlmApiKey } from '#src/domain/llmApiKey/LlmApiKey.js';

export interface IListLlmApiKeysUseCase {
  execute(userId: string): Promise<LlmApiKey[]>;
}
