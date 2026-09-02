import type { LlmApiKey } from '#src/domain/llmApiKey/LlmApiKey.js';

export type LlmApiKeyDTO = {
  provider: string;
  model: string | null;
  baseUrl: string | null;
  monthlyTokenLimit: number | null;
};

export class LlmApiKeyMapper {
  toDTO(key: LlmApiKey): LlmApiKeyDTO {
    return {
      provider: key.provider,
      model: key.model,
      baseUrl: key.baseUrl,
      monthlyTokenLimit: key.monthlyTokenLimit,
    };
  }
}
