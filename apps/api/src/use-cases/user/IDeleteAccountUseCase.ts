export interface DeleteAccountInput {
  userId: string;
  password: string;
  /** Epoch-ms of the caller's session's last full authentication — see `REAUTH` in constants.ts. */
  authTime?: number | null;
}

export interface IDeleteAccountUseCase {
  execute(input: DeleteAccountInput): Promise<void>;
}
