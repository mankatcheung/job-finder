import type { IUpdateEmailUseCase } from '@/use-cases/user/IUpdateEmailUseCase.js';
import type { IUpdatePasswordUseCase } from '@/use-cases/user/IUpdatePasswordUseCase.js';
import type { IDeleteAccountUseCase } from '@/use-cases/user/IDeleteAccountUseCase.js';
import type {
  IExportUserDataUseCase,
  ExportUserDataOutput,
} from '@/use-cases/user/IExportUserDataUseCase.js';
import type {
  IGenerateTotpSecretUseCase,
  TotpSetup,
} from '@/use-cases/user/IGenerateTotpSecretUseCase.js';
import type { IConfirmTotpSetupUseCase } from '@/use-cases/user/IConfirmTotpSetupUseCase.js';
import type { IDisableTotpUseCase } from '@/use-cases/user/IDisableTotpUseCase.js';
import type { IGetTotpStatusUseCase } from '@/use-cases/user/IGetTotpStatusUseCase.js';

interface Deps {
  updateEmailUseCase: IUpdateEmailUseCase;
  updatePasswordUseCase: IUpdatePasswordUseCase;
  deleteAccountUseCase: IDeleteAccountUseCase;
  exportUserDataUseCase: IExportUserDataUseCase;
  generateTotpSecretUseCase: IGenerateTotpSecretUseCase;
  confirmTotpSetupUseCase: IConfirmTotpSetupUseCase;
  disableTotpUseCase: IDisableTotpUseCase;
  getTotpStatusUseCase: IGetTotpStatusUseCase;
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

  async beginTotpSetup(userId: string): Promise<TotpSetup> {
    return this.deps.generateTotpSecretUseCase.execute(userId);
  }

  async confirmTotpSetup(userId: string, code: string): Promise<void> {
    await this.deps.confirmTotpSetupUseCase.execute({ userId, code });
  }

  async disableTotp(userId: string, password: string): Promise<void> {
    await this.deps.disableTotpUseCase.execute({ userId, password });
  }

  async getTotpStatus(userId: string): Promise<boolean> {
    return this.deps.getTotpStatusUseCase.execute(userId);
  }
}
