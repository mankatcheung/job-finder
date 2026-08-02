import type { User } from '#src/domain/user/User.js';

export interface ReauthenticateInput {
  userId: string;
  password: string;
  /** Only required when the user has 2FA enabled. */
  code?: string;
}

export interface ReauthenticateOutput {
  user: User;
  /** True when the password was valid but a TOTP code is still needed — caller should re-submit with `code`. */
  totpRequired: boolean;
}

export interface IReauthenticateUseCase {
  execute(input: ReauthenticateInput): Promise<ReauthenticateOutput>;
}
