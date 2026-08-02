export interface RequestEmailChangeInput {
  userId: string;
  currentPassword: string;
  newEmail: string;
  /** Epoch-ms of the caller's session's last full authentication — see `REAUTH` in constants.ts. */
  authTime?: number | null;
}

export interface IRequestEmailChangeUseCase {
  execute(input: RequestEmailChangeInput): Promise<void>;
}
