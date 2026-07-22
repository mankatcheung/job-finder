export interface RequestPasswordResetInput {
  email: string;
}

export interface IRequestPasswordResetUseCase {
  execute(input: RequestPasswordResetInput): Promise<void>;
}
