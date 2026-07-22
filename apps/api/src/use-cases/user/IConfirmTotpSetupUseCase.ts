export interface ConfirmTotpSetupInput {
  userId: string;
  code: string;
}

export interface IConfirmTotpSetupUseCase {
  execute(input: ConfirmTotpSetupInput): Promise<void>;
}
