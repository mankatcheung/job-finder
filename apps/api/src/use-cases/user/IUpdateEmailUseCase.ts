export interface UpdateEmailInput {
  userId: string;
  currentPassword: string;
  newEmail: string;
}

export interface IUpdateEmailUseCase {
  execute(input: UpdateEmailInput): Promise<void>;
}
