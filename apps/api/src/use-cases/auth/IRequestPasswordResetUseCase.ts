export interface RequestPasswordResetInput {
  email: string;
  ipAddress: string | null;
}

export interface IRequestPasswordResetUseCase {
  execute(input: RequestPasswordResetInput): Promise<void>;
}
