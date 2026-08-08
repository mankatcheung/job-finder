export interface RemoveBackupEmailInput {
  userId: string;
  currentPassword: string;
  /** Epoch-ms of the caller's session's last full authentication — see `REAUTH` in constants.ts. */
  authTime?: number | null;
}

export interface IRemoveBackupEmailUseCase {
  execute(input: RemoveBackupEmailInput): Promise<void>;
}
