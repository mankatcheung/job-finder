import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IUpdateProfileUseCase,
  UpdateProfileInput,
} from '@/use-cases/user/IUpdateProfileUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

const MAX_NAME_LENGTH = 100;
const MAX_TARGET_ROLE_LENGTH = 100;

function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** Trims a nullable string field; an empty result clears the field (null). Undefined leaves it untouched. */
function normalize(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class UpdateProfileUseCase implements IUpdateProfileUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateProfileInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    const name = normalize(input.name);
    const timezone = normalize(input.timezone);
    const targetRole = normalize(input.targetRole);

    if (name && name.length > MAX_NAME_LENGTH) {
      throw Object.assign(new Error('Name is too long'), { code: ERROR_CODES.VALIDATION });
    }
    if (targetRole && targetRole.length > MAX_TARGET_ROLE_LENGTH) {
      throw Object.assign(new Error('Target role is too long'), {
        code: ERROR_CODES.VALIDATION,
      });
    }
    if (timezone && !isValidTimezone(timezone)) {
      throw Object.assign(new Error('Invalid timezone'), { code: ERROR_CODES.VALIDATION });
    }

    await this.deps.userRepository.update(input.userId, { name, timezone, targetRole });
  }
}
