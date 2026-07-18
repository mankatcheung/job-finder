export interface DeleteAccountInput {
  userId: string;
  password: string;
}

export interface IDeleteAccountUseCase {
  execute(input: DeleteAccountInput): Promise<void>;
}
