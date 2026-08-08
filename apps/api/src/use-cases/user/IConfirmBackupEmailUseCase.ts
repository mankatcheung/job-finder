export interface ConfirmBackupEmailInput {
  token: string;
}

export interface IConfirmBackupEmailUseCase {
  execute(input: ConfirmBackupEmailInput): Promise<void>;
}
