import type { LoginEvent } from '#src/domain/loginEvent/LoginEvent.js';

export type LoginEventDTO = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export class LoginEventMapper {
  toDTO(event: LoginEvent): LoginEventDTO {
    return {
      id: event.id,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
