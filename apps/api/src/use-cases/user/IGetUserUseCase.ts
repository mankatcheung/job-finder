import type { User } from '#src/domain/user/User.js';

export interface IGetUserUseCase {
  execute(userId: string): Promise<User | null>;
}
