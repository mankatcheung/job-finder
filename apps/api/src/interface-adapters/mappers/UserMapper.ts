import type { User } from '#src/domain/user/User.js';

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
  avatarUrl: string | null;
}

export class UserMapper {
  toDTO(user: User, avatarUrl: string | null): UserDTO {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      targetRole: user.targetRole,
      avatarUrl,
    };
  }
}
