export interface ConfirmTotpSetupInput {
  userId: string;
  code: string;
}

export interface ConfirmTotpSetupOutput {
  backupCodes: string[];
}

export interface IConfirmTotpSetupUseCase {
  execute(input: ConfirmTotpSetupInput): Promise<ConfirmTotpSetupOutput>;
}
