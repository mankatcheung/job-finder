export interface TestLlmApiKeyInput {
  userId: string;
  provider: string;
  /**
   * Raw, unsaved key value to test directly (the add-key form, before
   * `Save`). Omitted (or blank) means test the already-persisted key for
   * `provider` instead — see `TestLlmApiKeyUseCase`.
   */
  apiKey?: string | null;
  /** Optional model override; required when provider is 'custom' and apiKey is given. */
  model?: string | null;
  /** Base URL; only valid (and required) when provider is 'custom' and apiKey is given. */
  baseUrl?: string | null;
}

export interface TestLlmApiKeyResult {
  ok: boolean;
  /**
   * Short, provider-reported failure description for display when `ok` is
   * false — not present on success. Not categorized (bad key vs. rate
   * limited vs. network) by design for now; see JEF-247.
   */
  error?: string | null;
}

export interface ITestLlmApiKeyUseCase {
  execute(input: TestLlmApiKeyInput): Promise<TestLlmApiKeyResult>;
}
