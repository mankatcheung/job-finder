export interface RequestBackupEmailRecoveryInput {
  backupEmail: string;
  ipAddress: string | null;
}

export interface IRequestBackupEmailRecoveryUseCase {
  execute(input: RequestBackupEmailRecoveryInput): Promise<void>;
}
