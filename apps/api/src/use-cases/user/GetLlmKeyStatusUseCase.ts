import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import type {
  IGetLlmKeyStatusUseCase,
  LlmKeyStatus,
} from '#src/use-cases/user/IGetLlmKeyStatusUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class GetLlmKeyStatusUseCase implements IGetLlmKeyStatusUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<LlmKeyStatus> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    return {
      configured: Boolean(user.llmProvider && user.llmApiKey),
      provider: user.llmProvider,
      model: user.llmModel,
      baseUrl: user.llmBaseUrl,
    };
  }
}
