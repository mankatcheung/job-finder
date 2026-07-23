export interface ISendEmailVerificationUseCase {
  execute(userId: string): Promise<void>;
}
