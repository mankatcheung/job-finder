export interface DeleteLlmApiKeyInput {
  userId: string;
  provider: string;
}

export interface IDeleteLlmApiKeyUseCase {
  execute(input: DeleteLlmApiKeyInput): Promise<void>;
}
