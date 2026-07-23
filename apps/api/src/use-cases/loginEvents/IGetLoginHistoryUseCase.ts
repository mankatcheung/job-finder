import type { LoginEvent } from '@/domain/loginEvent/LoginEvent.js';

export interface IGetLoginHistoryUseCase {
  execute(userId: string): Promise<LoginEvent[]>;
}
