export interface SetDefaultLlmProviderInput {
  userId: string;
  provider: string;
}

export interface ISetDefaultLlmProviderUseCase {
  execute(input: SetDefaultLlmProviderInput): Promise<void>;
}
