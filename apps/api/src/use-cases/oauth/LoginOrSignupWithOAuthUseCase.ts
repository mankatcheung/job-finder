import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IOAuthAccountRepository } from '@/use-cases/ports/IOAuthAccountRepository.js';
import type { IOAuthProviderRegistry } from '@/use-cases/ports/IOAuthProviderRegistry.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  ILoginOrSignupWithOAuthUseCase,
  LoginOrSignupWithOAuthInput,
  LoginOrSignupWithOAuthOutput,
} from '@/use-cases/oauth/ILoginOrSignupWithOAuthUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  oauthAccountRepository: IOAuthAccountRepository;
  oauthProviderRegistry: IOAuthProviderRegistry;
  generateId: () => string;
}

export class LoginOrSignupWithOAuthUseCase implements ILoginOrSignupWithOAuthUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LoginOrSignupWithOAuthInput): Promise<LoginOrSignupWithOAuthOutput> {
    const provider = this.deps.oauthProviderRegistry.get(input.provider);
    const profile = await provider.exchangeCodeForProfile(input.code, input.redirectUri);

    const existingLink = await this.deps.oauthAccountRepository.findByProvider(
      input.provider,
      profile.providerAccountId,
    );
    if (existingLink) {
      const user = await this.deps.userRepository.findById(existingLink.userId);
      if (!user) {
        throw Object.assign(new Error('Linked account not found'), {
          code: ERROR_CODES.NOT_FOUND,
        });
      }
      return { user, isNewUser: false };
    }

    if (!profile.email || !profile.emailVerified) {
      throw Object.assign(
        new Error(
          'Your provider did not share a verified email address, so an account cannot be created automatically.',
        ),
        { code: ERROR_CODES.VALIDATION },
      );
    }

    const existingUser = await this.deps.userRepository.findByEmail(profile.email);
    if (existingUser) {
      // Deliberately not auto-linking: silently attaching a new OAuth identity
      // to an existing account based only on a matching email is a known
      // account-takeover vector. The user must log in with their existing
      // method first and link this provider explicitly from settings.
      throw Object.assign(
        new Error(
          'An account with this email already exists. Log in and link this provider from account settings.',
        ),
        { code: ERROR_CODES.CONFLICT },
      );
    }

    const user = await this.deps.userRepository.create({
      id: this.deps.generateId(),
      email: profile.email,
      passwordHash: null,
      name: profile.name,
      emailVerifiedAt: new Date(),
    });
    await this.deps.oauthAccountRepository.create({
      id: this.deps.generateId(),
      userId: user.id,
      provider: input.provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email,
    });

    return { user, isNewUser: true };
  }
}
