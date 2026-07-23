import type { IUpdateEmailUseCase } from '@/use-cases/user/IUpdateEmailUseCase.js';
import type { IUpdatePasswordUseCase } from '@/use-cases/user/IUpdatePasswordUseCase.js';
import type { IDeleteAccountUseCase } from '@/use-cases/user/IDeleteAccountUseCase.js';
import type {
  IExportUserDataUseCase,
  ExportUserDataOutput,
} from '@/use-cases/user/IExportUserDataUseCase.js';
import type {
  IImportUserDataUseCase,
  ImportSummary,
} from '@/use-cases/user/IImportUserDataUseCase.js';

interface Deps {
  updateEmailUseCase: IUpdateEmailUseCase;
  updatePasswordUseCase: IUpdatePasswordUseCase;
  deleteAccountUseCase: IDeleteAccountUseCase;
  exportUserDataUseCase: IExportUserDataUseCase;
  importUserDataUseCase: IImportUserDataUseCase;
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

  async importUserData(userId: string, rawData: string): Promise<ImportSummary> {
    return this.deps.importUserDataUseCase.execute(userId, rawData);
  }
}
