export interface ConfirmEmailChangeInput {
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IConfirmEmailChangeUseCase {
  execute(input: ConfirmEmailChangeInput): Promise<void>;
}
