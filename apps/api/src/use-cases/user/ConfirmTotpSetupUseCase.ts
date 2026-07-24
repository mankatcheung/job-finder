import { createHash, randomBytes } from 'crypto';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { ITotpBackupCodeRepository } from '@/use-cases/ports/ITotpBackupCodeRepository.js';
import type { ITotpProvider } from '@/use-cases/ports/ITotpProvider.js';
import { ERROR_CODES, TOTP_BACKUP_CODES } from '@/constants.js';
import type {
  IConfirmTotpSetupUseCase,
  ConfirmTotpSetupInput,
  ConfirmTotpSetupOutput,
} from '@/use-cases/user/IConfirmTotpSetupUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  totpBackupCodeRepository: ITotpBackupCodeRepository;
  totpProvider: ITotpProvider;
  generateId: () => string;
}

export class ConfirmTotpSetupUseCase implements IConfirmTotpSetupUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ConfirmTotpSetupInput): Promise<ConfirmTotpSetupOutput> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    if (user.totpEnabled) {
      throw Object.assign(new Error('Two-factor authentication is already enabled'), {
        code: ERROR_CODES.CONFLICT,
      });
    }
    if (!user.totpSecret) {
      throw Object.assign(new Error('No two-factor setup in progress'), {
        code: ERROR_CODES.CONFLICT,
      });
    }

    const secret = this.deps.totpProvider.decryptSecret(user.totpSecret);
    const valid = await this.deps.totpProvider.verifyCode(secret, input.code);
    if (!valid) {
      throw Object.assign(new Error('Invalid verification code'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    await this.deps.userRepository.update(input.userId, { totpEnabled: true });

    const backupCodes = Array.from({ length: TOTP_BACKUP_CODES.COUNT }, () =>
      randomBytes(TOTP_BACKUP_CODES.RANDOM_BYTES).toString('hex'),
    );
    await Promise.all(
      backupCodes.map((code) =>
        this.deps.totpBackupCodeRepository.create({
          id: this.deps.generateId(),
          userId: input.userId,
          codeHash: createHash('sha256').update(code).digest('hex'),
        }),
      ),
    );

    return { backupCodes };
  }
}
