import type { User } from '@/domain/user/User.js';

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginOutput = User;

export interface ILoginUseCase {
  execute(input: LoginInput): Promise<LoginOutput>;
}
