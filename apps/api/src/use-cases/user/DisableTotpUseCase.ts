import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { ITotpBackupCodeRepository } from '@/use-cases/ports/ITotpBackupCodeRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IDisableTotpUseCase,
  DisableTotpInput,
} from '@/use-cases/user/IDisableTotpUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  totpBackupCodeRepository: ITotpBackupCodeRepository;
}

export class DisableTotpUseCase implements IDisableTotpUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DisableTotpInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid)
      throw Object.assign(new Error('Invalid password'), { code: ERROR_CODES.UNAUTHORIZED });

    await this.deps.userRepository.update(input.userId, {
      totpEnabled: false,
      totpSecret: null,
    });
    await this.deps.totpBackupCodeRepository.deleteAllForUser(input.userId);
  }
}
