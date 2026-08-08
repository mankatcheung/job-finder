export interface DisableTotpInput {
  userId: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IDisableTotpUseCase {
  execute(input: DisableTotpInput): Promise<void>;
}
