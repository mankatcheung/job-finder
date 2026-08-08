import type { SecurityActivityItem } from '#src/use-cases/securityEvents/IGetSecurityActivityUseCase.js';

export type SecurityActivityDTO = {
  id: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export class SecurityActivityMapper {
  toDTO(item: SecurityActivityItem): SecurityActivityDTO {
    return {
      id: item.id,
      eventType: item.eventType,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
