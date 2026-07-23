import type { IUpdateEmailUseCase } from '@/use-cases/user/IUpdateEmailUseCase.js';
import type { IUpdatePasswordUseCase } from '@/use-cases/user/IUpdatePasswordUseCase.js';
import type { IDeleteAccountUseCase } from '@/use-cases/user/IDeleteAccountUseCase.js';
import type {
  IExportUserDataUseCase,
  ExportUserDataOutput,
} from '@/use-cases/user/IExportUserDataUseCase.js';
import type { IUpdateProfileUseCase } from '@/use-cases/user/IUpdateProfileUseCase.js';
import type { IGetUserUseCase } from '@/use-cases/user/IGetUserUseCase.js';
import type { User } from '@/domain/user/User.js';

interface Deps {
  updateEmailUseCase: IUpdateEmailUseCase;
  updatePasswordUseCase: IUpdatePasswordUseCase;
  deleteAccountUseCase: IDeleteAccountUseCase;
  exportUserDataUseCase: IExportUserDataUseCase;
  updateProfileUseCase: IUpdateProfileUseCase;
  getUserUseCase: IGetUserUseCase;
}

export class UserResolver {
  constructor(private readonly deps: Deps) {}

  async updateEmail(userId: string, currentPassword: string, newEmail: string): Promise<void> {
    await this.deps.updateEmailUseCase.execute({ userId, currentPassword, newEmail });
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.deps.updatePasswordUseCase.execute({ userId, currentPassword, newPassword });
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    await this.deps.deleteAccountUseCase.execute({ userId, password });
  }

  async exportUserData(userId: string): Promise<ExportUserDataOutput> {
    return this.deps.exportUserDataUseCase.execute(userId);
  }

  async updateProfile(
    userId: string,
    name?: string | null,
    timezone?: string | null,
    targetRole?: string | null,
  ): Promise<void> {
    await this.deps.updateProfileUseCase.execute({ userId, name, timezone, targetRole });
  }

  async getMe(userId: string): Promise<User | null> {
    return this.deps.getUserUseCase.execute(userId);
  }
}
