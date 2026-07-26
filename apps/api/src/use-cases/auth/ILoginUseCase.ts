import type { User } from '#src/domain/user/User.js';

export type LoginInput = {
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type LoginOutput = User;

export interface ILoginUseCase {
  execute(input: LoginInput): Promise<LoginOutput>;
}
