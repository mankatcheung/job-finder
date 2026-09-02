import { NotFoundError, ValidationError } from '#src/use-cases/errors/DomainError.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type {
  ISetLlmApiKeyMonthlyLimitUseCase,
  SetLlmApiKeyMonthlyLimitInput,
} from '#src/use-cases/user/ISetLlmApiKeyMonthlyLimitUseCase.js';

interface Deps {
  llmApiKeyRepository: ILlmApiKeyRepository;
}

/**
 * Sets the monthly token ceiling on one of the user's own keys (JEF-258),
 * or clears it with null.
 *
 * Deliberately separate from `SaveLlmApiKeyUseCase`: rotating an API key and
 * changing how much you're willing to spend on it are different decisions,
 * and folding them together would mean re-entering the secret to change a
 * number. The repository's `upsert` leaves this column alone for the same
 * reason.
 */
export class SetLlmApiKeyMonthlyLimitUseCase implements ISetLlmApiKeyMonthlyLimitUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: SetLlmApiKeyMonthlyLimitInput): Promise<void> {
    const { monthlyTokenLimit } = input;

    if (monthlyTokenLimit !== null) {
      if (!Number.isInteger(monthlyTokenLimit)) {
        throw new ValidationError('Monthly token limit must be a whole number');
      }
      // Zero would be a key that can never be used, which is what removing
      // the key is for — and it reads as "no limit" to anyone skimming.
      if (monthlyTokenLimit < 1) {
        throw new ValidationError('Monthly token limit must be at least 1');
      }
    }

    const updated = await this.deps.llmApiKeyRepository.setMonthlyTokenLimit(
      input.userId,
      input.provider,
      monthlyTokenLimit,
    );

    if (!updated) throw new NotFoundError('No API key configured for this provider');
  }
}
