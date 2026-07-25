import type { IRequestEmailChangeUseCase } from '@/use-cases/user/IRequestEmailChangeUseCase.js';
import type { IConfirmEmailChangeUseCase } from '@/use-cases/user/IConfirmEmailChangeUseCase.js';
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
import type {
  IConfirmTotpSetupUseCase,
  ConfirmTotpSetupOutput,
} from '@/use-cases/user/IConfirmTotpSetupUseCase.js';
import type { IDisableTotpUseCase } from '@/use-cases/user/IDisableTotpUseCase.js';
import type { IGetTotpStatusUseCase } from '@/use-cases/user/IGetTotpStatusUseCase.js';
import type {
  IImportUserDataUseCase,
  ImportSummary,
} from '@/use-cases/user/IImportUserDataUseCase.js';
import type {
  IGetNotificationPreferencesUseCase,
  NotificationPreferences,
} from '@/use-cases/user/IGetNotificationPreferencesUseCase.js';
import type { IUpdateNotificationPreferencesUseCase } from '@/use-cases/user/IUpdateNotificationPreferencesUseCase.js';
import type { IUpdateProfileUseCase } from '@/use-cases/user/IUpdateProfileUseCase.js';
import type { IGetUserUseCase } from '@/use-cases/user/IGetUserUseCase.js';
import type { User } from '@/domain/user/User.js';

interface Deps {
  requestEmailChangeUseCase: IRequestEmailChangeUseCase;
  confirmEmailChangeUseCase: IConfirmEmailChangeUseCase;
  updatePasswordUseCase: IUpdatePasswordUseCase;
  deleteAccountUseCase: IDeleteAccountUseCase;
  exportUserDataUseCase: IExportUserDataUseCase;
  generateTotpSecretUseCase: IGenerateTotpSecretUseCase;
  confirmTotpSetupUseCase: IConfirmTotpSetupUseCase;
  disableTotpUseCase: IDisableTotpUseCase;
  getTotpStatusUseCase: IGetTotpStatusUseCase;
  importUserDataUseCase: IImportUserDataUseCase;
  getNotificationPreferencesUseCase: IGetNotificationPreferencesUseCase;
  updateNotificationPreferencesUseCase: IUpdateNotificationPreferencesUseCase;
  updateProfileUseCase: IUpdateProfileUseCase;
  getUserUseCase: IGetUserUseCase;
}

export class UserResolver {
  constructor(private readonly deps: Deps) {}

  async requestEmailChange(
    userId: string,
    currentPassword: string,
    newEmail: string,
  ): Promise<void> {
    await this.deps.requestEmailChangeUseCase.execute({ userId, currentPassword, newEmail });
  }

  async confirmEmailChange(token: string): Promise<void> {
    await this.deps.confirmEmailChangeUseCase.execute({ token });
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

  async beginTotpSetup(userId: string, password: string): Promise<TotpSetup> {
    return this.deps.generateTotpSecretUseCase.execute({ userId, password });
  }

  async confirmTotpSetup(userId: string, code: string): Promise<ConfirmTotpSetupOutput> {
    return this.deps.confirmTotpSetupUseCase.execute({ userId, code });
  }

  async disableTotp(userId: string, password: string): Promise<void> {
    await this.deps.disableTotpUseCase.execute({ userId, password });
  }

  async getTotpStatus(userId: string): Promise<boolean> {
    return this.deps.getTotpStatusUseCase.execute(userId);
  }

  async importUserData(userId: string, rawData: string): Promise<ImportSummary> {
    return this.deps.importUserDataUseCase.execute(userId, rawData);
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    return this.deps.getNotificationPreferencesUseCase.execute(userId);
  }

  async updateNotificationPreferences(
    userId: string,
    weeklyDigestEnabled?: boolean,
    followUpRemindersEnabled?: boolean,
  ): Promise<void> {
    await this.deps.updateNotificationPreferencesUseCase.execute({
      userId,
      weeklyDigestEnabled,
      followUpRemindersEnabled,
    });
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
