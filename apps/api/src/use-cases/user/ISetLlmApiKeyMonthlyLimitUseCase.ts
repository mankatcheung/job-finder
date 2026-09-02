export interface SetLlmApiKeyMonthlyLimitInput {
  userId: string;
  provider: string;
  /** Null clears the limit. */
  monthlyTokenLimit: number | null;
}

export interface ISetLlmApiKeyMonthlyLimitUseCase {
  execute(input: SetLlmApiKeyMonthlyLimitInput): Promise<void>;
}
