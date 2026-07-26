import type { IRequestEmailChangeUseCase } from '#src/use-cases/user/IRequestEmailChangeUseCase.js';
import type { IConfirmEmailChangeUseCase } from '#src/use-cases/user/IConfirmEmailChangeUseCase.js';
import type { IUpdatePasswordUseCase } from '#src/use-cases/user/IUpdatePasswordUseCase.js';
import type { IDeleteAccountUseCase } from '#src/use-cases/user/IDeleteAccountUseCase.js';
import type {
  IExportUserDataUseCase,
  ExportUserDataOutput,
} from '#src/use-cases/user/IExportUserDataUseCase.js';
import type {
  IGenerateTotpSecretUseCase,
  TotpSetup,
} from '#src/use-cases/user/IGenerateTotpSecretUseCase.js';
import type {
  IConfirmTotpSetupUseCase,
  ConfirmTotpSetupOutput,
} from '#src/use-cases/user/IConfirmTotpSetupUseCase.js';
import type { IDisableTotpUseCase } from '#src/use-cases/user/IDisableTotpUseCase.js';
import type { IGetTotpStatusUseCase } from '#src/use-cases/user/IGetTotpStatusUseCase.js';
import type {
  IImportUserDataUseCase,
  ImportSummary,
} from '#src/use-cases/user/IImportUserDataUseCase.js';
import type {
  IGetNotificationPreferencesUseCase,
  NotificationPreferences,
} from '#src/use-cases/user/IGetNotificationPreferencesUseCase.js';
import type { IUpdateNotificationPreferencesUseCase } from '#src/use-cases/user/IUpdateNotificationPreferencesUseCase.js';
import type { IUpdateProfileUseCase } from '#src/use-cases/user/IUpdateProfileUseCase.js';
import type { IGetUserUseCase } from '#src/use-cases/user/IGetUserUseCase.js';
import type {
  IRequestAvatarUploadUrlUseCase,
  RequestAvatarUploadUrlOutput,
} from '#src/use-cases/user/IRequestAvatarUploadUrlUseCase.js';
import type { IConfirmAvatarUseCase } from '#src/use-cases/user/IConfirmAvatarUseCase.js';
import type { IRemoveAvatarUseCase } from '#src/use-cases/user/IRemoveAvatarUseCase.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import { UserMapper, type UserDTO } from '#src/interface-adapters/mappers/UserMapper.js';

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
  requestAvatarUploadUrlUseCase: IRequestAvatarUploadUrlUseCase;
  confirmAvatarUseCase: IConfirmAvatarUseCase;
  removeAvatarUseCase: IRemoveAvatarUseCase;
  storageProvider: IStorageProvider;
  userMapper: UserMapper;
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

  async getMe(userId: string): Promise<UserDTO | null> {
    const user = await this.deps.getUserUseCase.execute(userId);
    if (!user) return null;
    const avatarUrl = user.avatarKey
      ? await this.deps.storageProvider.getSignedUrl(user.avatarKey)
      : null;
    return this.deps.userMapper.toDTO(user, avatarUrl);
  }

  async requestAvatarUploadUrl(
    userId: string,
    filename: string,
    mimeType: string,
  ): Promise<RequestAvatarUploadUrlOutput> {
    return this.deps.requestAvatarUploadUrlUseCase.execute({ userId, filename, mimeType });
  }

  async confirmAvatar(
    userId: string,
    storageKey: string,
    mimeType: string,
    sizeBytes: number,
  ): Promise<string> {
    await this.deps.confirmAvatarUseCase.execute({ userId, storageKey, mimeType, sizeBytes });
    return this.deps.storageProvider.getSignedUrl(storageKey);
  }

  async removeAvatar(userId: string): Promise<void> {
    await this.deps.removeAvatarUseCase.execute(userId);
  }
}
