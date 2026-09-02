export type LlmApiKey = {
  id: string;
  userId: string;
  provider: string;
  /** Encrypted at rest. */
  apiKey: string;
  model: string | null;
  baseUrl: string | null;
  /** Monthly prompt+completion token ceiling; null means no limit (JEF-258). */
  monthlyTokenLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
};
