export interface ConfirmEmailChangeInput {
  token: string;
}

export interface IConfirmEmailChangeUseCase {
  execute(input: ConfirmEmailChangeInput): Promise<void>;
}
