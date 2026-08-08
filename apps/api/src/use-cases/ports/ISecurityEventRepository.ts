import type { SecurityEvent, SecurityEventType } from '#src/domain/securityEvent/SecurityEvent.js';

export interface CreateSecurityEventData {
  id: string;
  userId: string;
  eventType: SecurityEventType;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ISecurityEventRepository {
  create(data: CreateSecurityEventData): Promise<SecurityEvent>;
  findRecentByUserId(userId: string, limit: number): Promise<SecurityEvent[]>;
}
