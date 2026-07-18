export interface UpdatePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface IUpdatePasswordUseCase {
  execute(input: UpdatePasswordInput): Promise<void>;
}
