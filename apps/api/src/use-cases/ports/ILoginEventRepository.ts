import type { LoginEvent } from '@/domain/loginEvent/LoginEvent.js';

export interface CreateLoginEventData {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ILoginEventRepository {
  create(data: CreateLoginEventData): Promise<LoginEvent>;
  findRecentByUserId(userId: string, limit: number): Promise<LoginEvent[]>;
}
