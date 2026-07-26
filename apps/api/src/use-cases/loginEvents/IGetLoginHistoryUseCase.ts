import type { LoginEvent } from '#src/domain/loginEvent/LoginEvent.js';

export interface IGetLoginHistoryUseCase {
  execute(userId: string): Promise<LoginEvent[]>;
}
