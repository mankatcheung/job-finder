export interface RequestEmailChangeInput {
  userId: string;
  currentPassword: string;
  newEmail: string;
}

export interface IRequestEmailChangeUseCase {
  execute(input: RequestEmailChangeInput): Promise<void>;
}
