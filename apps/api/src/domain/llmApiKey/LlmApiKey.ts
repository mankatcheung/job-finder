export type LlmApiKey = {
  id: string;
  userId: string;
  provider: string;
  /** Encrypted at rest. */
  apiKey: string;
  model: string | null;
  baseUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};
