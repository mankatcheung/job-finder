import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IOAuthAccountRepository } from '@/use-cases/ports/IOAuthAccountRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IUnlinkOAuthAccountUseCase,
  UnlinkOAuthAccountInput,
} from '@/use-cases/oauth/IUnlinkOAuthAccountUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  oauthAccountRepository: IOAuthAccountRepository;
}

export class UnlinkOAuthAccountUseCase implements IUnlinkOAuthAccountUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UnlinkOAuthAccountInput): Promise<void> {
    const links = await this.deps.oauthAccountRepository.findAllByUserId(input.userId);
    const target = links.find((l) => l.provider === input.provider);
    if (!target) return; // Already unlinked — idempotent no-op.

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    // If this is the only way to sign in (no password, no other linked
    // provider), removing it would lock the user out entirely.
    if (user.passwordHash === null && links.length === 1) {
      throw Object.assign(new Error('Set a password before unlinking your only sign-in method'), {
        code: ERROR_CODES.VALIDATION,
      });
    }

    await this.deps.oauthAccountRepository.delete(target.id);
  }
}
