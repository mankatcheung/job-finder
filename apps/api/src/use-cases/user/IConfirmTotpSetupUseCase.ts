export interface ConfirmTotpSetupInput {
  userId: string;
  code: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ConfirmTotpSetupOutput {
  backupCodes: string[];
}

export interface IConfirmTotpSetupUseCase {
  execute(input: ConfirmTotpSetupInput): Promise<ConfirmTotpSetupOutput>;
}
