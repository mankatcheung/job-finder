export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterOutput {
  userId: string;
  email: string;
}

export interface IRegisterUseCase {
  execute(input: RegisterInput): Promise<RegisterOutput>;
}
