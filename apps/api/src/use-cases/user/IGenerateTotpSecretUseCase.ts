export interface TotpSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface GenerateTotpSecretInput {
  userId: string;
  password: string;
}

export interface IGenerateTotpSecretUseCase {
  execute(input: GenerateTotpSecretInput): Promise<TotpSetup>;
}
