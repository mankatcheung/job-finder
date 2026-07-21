import type { User } from '@/domain/user/User.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: { id: string; email: string; passwordHash: string }): Promise<User>;
  update(id: string, data: { email?: string; passwordHash?: string }): Promise<User>;
  delete(id: string): Promise<void>;
}
