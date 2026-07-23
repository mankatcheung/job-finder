import type { User } from '@/domain/user/User.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: { id: string; email: string; passwordHash: string }): Promise<User>;
  update(
    id: string,
    data: {
      email?: string;
      passwordHash?: string;
      name?: string | null;
      timezone?: string | null;
      targetRole?: string | null;
      emailVerifiedAt?: Date | null;
      weeklyDigestEnabled?: boolean;
      followUpRemindersEnabled?: boolean;
      totpSecret?: string | null;
      totpEnabled?: boolean;
    },
  ): Promise<User>;
  delete(id: string): Promise<void>;
}
