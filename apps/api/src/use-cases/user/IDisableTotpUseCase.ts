export interface DisableTotpInput {
  userId: string;
  password: string;
}

export interface IDisableTotpUseCase {
  execute(input: DisableTotpInput): Promise<void>;
}
