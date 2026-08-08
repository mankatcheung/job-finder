export interface RequestAddBackupEmailInput {
  userId: string;
  backupEmail: string;
  currentPassword: string;
  /** Epoch-ms of the caller's session's last full authentication — see `REAUTH` in constants.ts. */
  authTime?: number | null;
}

export interface IRequestAddBackupEmailUseCase {
  execute(input: RequestAddBackupEmailInput): Promise<void>;
}
