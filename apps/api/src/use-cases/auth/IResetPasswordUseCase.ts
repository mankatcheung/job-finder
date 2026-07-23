export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface IResetPasswordUseCase {
  execute(input: ResetPasswordInput): Promise<void>;
}
