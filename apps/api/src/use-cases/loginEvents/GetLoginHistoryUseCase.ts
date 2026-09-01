import type { ILoginEventRepository } from '#src/use-cases/ports/ILoginEventRepository.js';
import type { LoginEvent } from '#src/domain/loginEvent/LoginEvent.js';
import type { IGetLoginHistoryUseCase } from '#src/use-cases/loginEvents/IGetLoginHistoryUseCase.js';
import { LOGIN_HISTORY } from '#src/use-cases/constants.js';

interface Deps {
  loginEventRepository: ILoginEventRepository;
}

export class GetLoginHistoryUseCase implements IGetLoginHistoryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<LoginEvent[]> {
    return this.deps.loginEventRepository.findRecentByUserId(userId, LOGIN_HISTORY.LIMIT);
  }
}
