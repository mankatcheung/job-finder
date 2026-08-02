export interface UpdatePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
  /** Epoch-ms of the caller's session's last full authentication — see `REAUTH` in constants.ts. */
  authTime?: number | null;
}

export interface IUpdatePasswordUseCase {
  execute(input: UpdatePasswordInput): Promise<void>;
}
