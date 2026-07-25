export interface IRemoveAvatarUseCase {
  execute(userId: string): Promise<void>;
}
