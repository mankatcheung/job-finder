export interface RegenerateTotpBackupCodesInput {
  userId: string;
  currentPassword: string;
  authTime?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RegenerateTotpBackupCodesOutput {
  backupCodes: string[];
}

export interface IRegenerateTotpBackupCodesUseCase {
  execute(input: RegenerateTotpBackupCodesInput): Promise<RegenerateTotpBackupCodesOutput>;
}
