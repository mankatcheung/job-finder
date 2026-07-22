export interface VerifyEmailInput {
  token: string;
}

export interface IVerifyEmailUseCase {
  execute(input: VerifyEmailInput): Promise<void>;
}
