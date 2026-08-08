import type { IGetSecurityActivityUseCase } from '#src/use-cases/securityEvents/IGetSecurityActivityUseCase.js';
import type {
  SecurityActivityMapper,
  SecurityActivityDTO,
} from '#src/interface-adapters/mappers/SecurityActivityMapper.js';

interface Deps {
  getSecurityActivityUseCase: IGetSecurityActivityUseCase;
  securityActivityMapper: SecurityActivityMapper;
}

export class SecurityActivityResolver {
  constructor(private readonly deps: Deps) {}

  async getSecurityActivity(userId: string): Promise<SecurityActivityDTO[]> {
    const items = await this.deps.getSecurityActivityUseCase.execute(userId);
    return items.map((i) => this.deps.securityActivityMapper.toDTO(i));
  }
}
