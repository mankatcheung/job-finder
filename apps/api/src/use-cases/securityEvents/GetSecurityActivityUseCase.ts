import type { ILoginEventRepository } from '#src/use-cases/ports/ILoginEventRepository.js';
import type { ISecurityEventRepository } from '#src/use-cases/ports/ISecurityEventRepository.js';
import type {
  IGetSecurityActivityUseCase,
  SecurityActivityItem,
} from '#src/use-cases/securityEvents/IGetSecurityActivityUseCase.js';
import { SECURITY_ACTIVITY } from '#src/use-cases/constants.js';

interface Deps {
  loginEventRepository: ILoginEventRepository;
  securityEventRepository: ISecurityEventRepository;
}

export class GetSecurityActivityUseCase implements IGetSecurityActivityUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<SecurityActivityItem[]> {
    // Each source is fetched up to the full limit (not split N/2) so merging
    // and truncating to the overall limit afterward can't drop genuinely
    // recent items just because one source happens to dominate.
    const [logins, events] = await Promise.all([
      this.deps.loginEventRepository.findRecentByUserId(userId, SECURITY_ACTIVITY.LIMIT),
      this.deps.securityEventRepository.findRecentByUserId(userId, SECURITY_ACTIVITY.LIMIT),
    ]);

    const items: SecurityActivityItem[] = [
      ...logins.map((e): SecurityActivityItem => ({
        id: e.id,
        eventType: 'login',
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        createdAt: e.createdAt,
      })),
      ...events.map((e): SecurityActivityItem => ({
        id: e.id,
        eventType: e.eventType,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        createdAt: e.createdAt,
      })),
    ];

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, SECURITY_ACTIVITY.LIMIT);
  }
}
