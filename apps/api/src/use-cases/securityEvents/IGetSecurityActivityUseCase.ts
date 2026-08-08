import type { SecurityEventType } from '#src/domain/securityEvent/SecurityEvent.js';

export type SecurityActivityEventType = 'login' | SecurityEventType;

export type SecurityActivityItem = {
  id: string;
  eventType: SecurityActivityEventType;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export interface IGetSecurityActivityUseCase {
  execute(userId: string): Promise<SecurityActivityItem[]>;
}
