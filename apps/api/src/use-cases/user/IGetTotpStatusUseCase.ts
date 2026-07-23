export interface IGetTotpStatusUseCase {
  execute(userId: string): Promise<boolean>;
}
