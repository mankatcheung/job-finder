import type { User } from '@/domain/user/User.js';

export interface LoginWithTotpInput {
  email: string;
  password: string;
  code: string;
}

export interface ILoginWithTotpUseCase {
  execute(input: LoginWithTotpInput): Promise<User>;
}
