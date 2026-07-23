import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import type { User } from '@/domain/user/User.js';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { ITotpBackupCodeRepository } from '@/use-cases/ports/ITotpBackupCodeRepository.js';
import type { IRateLimiter } from '@/use-cases/ports/IRateLimiter.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import { decryptTotpSecret } from '@/infrastructure/auth/totpSecretCrypto.js';
import { ERROR_CODES, TOTP_CONFIG } from '@/constants.js';
import type {
  ILoginWithTotpUseCase,
  LoginWithTotpInput,
} from '@/use-cases/auth/ILoginWithTotpUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  totpBackupCodeRepository: ITotpBackupCodeRepository;
  totpRateLimiter: IRateLimiter;
}

export class LoginWithTotpUseCase implements ILoginWithTotpUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LoginWithTotpInput): Promise<User> {
    const user = await this.deps.userRepository.findByEmail(input.email);
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    if (!user.totpEnabled || !user.totpSecret) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    const allowedByEmail = this.deps.totpRateLimiter.consume(
      `totp:email:${input.email.toLowerCase()}`,
    );
    const allowedByIp = input.ipAddress
      ? this.deps.totpRateLimiter.consume(`totp:ip:${input.ipAddress}`)
      : true;
    if (!allowedByEmail || !allowedByIp) {
      throw Object.assign(new Error('Too many verification attempts. Please try again later.'), {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    // TOTP codes are always 6 digits — anything else can only be a backup code.
    const isTotpFormat = /^\d{6}$/.test(input.code);
    const secret = decryptTotpSecret(user.totpSecret);
    const validTotp = isTotpFormat
      ? (
          await createTotp({ secret }).verify(input.code, {
            epochTolerance: TOTP_CONFIG.EPOCH_TOLERANCE_S,
          })
        ).valid
      : false;

    if (!validTotp) {
      const codeHash = createHash('sha256').update(input.code).digest('hex');
      const backupCode = await this.deps.totpBackupCodeRepository.findByCodeHash(codeHash);
      const validBackupCode = backupCode && backupCode.userId === user.id && !backupCode.usedAt;
      if (!validBackupCode) {
        throw Object.assign(new Error('Invalid verification code'), {
          code: ERROR_CODES.UNAUTHORIZED,
        });
      }
      await this.deps.totpBackupCodeRepository.markUsed(backupCode.id);
    }

    return user;
  }
}
