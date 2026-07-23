import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import { encryptTotpSecret } from '@/infrastructure/auth/totpSecretCrypto.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IGenerateTotpSecretUseCase,
  GenerateTotpSecretInput,
  TotpSetup,
} from '@/use-cases/user/IGenerateTotpSecretUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class GenerateTotpSecretUseCase implements IGenerateTotpSecretUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GenerateTotpSecretInput): Promise<TotpSetup> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    if (user.totpEnabled) {
      throw Object.assign(new Error('Two-factor authentication is already enabled'), {
        code: ERROR_CODES.CONFLICT,
      });
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw Object.assign(new Error('Invalid password'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    const secret = createTotp().generateSecret();
    const otpauthUrl = createTotp({ secret, label: user.email }).toURI();
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await this.deps.userRepository.update(input.userId, {
      totpSecret: encryptTotpSecret(secret),
    });

    return { secret, otpauthUrl, qrCodeDataUrl };
  }
}
