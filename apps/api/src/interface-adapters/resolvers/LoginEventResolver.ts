import type { IGetLoginHistoryUseCase } from '@/use-cases/loginEvents/IGetLoginHistoryUseCase.js';
import type {
  LoginEventMapper,
  LoginEventDTO,
} from '@/interface-adapters/mappers/LoginEventMapper.js';

interface Deps {
  getLoginHistoryUseCase: IGetLoginHistoryUseCase;
  loginEventMapper: LoginEventMapper;
}

export class LoginEventResolver {
  constructor(private readonly deps: Deps) {}

  async getLoginHistory(userId: string): Promise<LoginEventDTO[]> {
    const events = await this.deps.getLoginHistoryUseCase.execute(userId);
    return events.map((e) => this.deps.loginEventMapper.toDTO(e));
  }
}
