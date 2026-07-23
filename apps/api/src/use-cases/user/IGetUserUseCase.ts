import type { User } from '@/domain/user/User.js';

export interface IGetUserUseCase {
  execute(userId: string): Promise<User | null>;
}
