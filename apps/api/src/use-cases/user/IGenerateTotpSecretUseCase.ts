export interface TotpSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface IGenerateTotpSecretUseCase {
  execute(userId: string): Promise<TotpSetup>;
}
