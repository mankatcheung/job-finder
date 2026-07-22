import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import { ERROR_CODES, TOTP_CONFIG } from '@/constants.js';
import type {
  IConfirmTotpSetupUseCase,
  ConfirmTotpSetupInput,
} from '@/use-cases/user/IConfirmTotpSetupUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class ConfirmTotpSetupUseCase implements IConfirmTotpSetupUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ConfirmTotpSetupInput): Promise<void> {
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

    const result = await createTotp({ secret: user.totpSecret }).verify(input.code, {
      epochTolerance: TOTP_CONFIG.EPOCH_TOLERANCE_S,
    });
    if (!result.valid) {
      throw Object.assign(new Error('Invalid verification code'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    await this.deps.userRepository.update(input.userId, { totpEnabled: true });
  }
}
