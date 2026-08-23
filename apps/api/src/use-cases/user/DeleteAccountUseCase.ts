import {
  NotFoundError,
  StepUpRequiredError,
  UnauthorizedError,
} from '#src/use-cases/errors/DomainError.js';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import { isSessionFresh } from '#src/use-cases/auth/sessionFreshness.js';
import type {
  IDeleteAccountUseCase,
  DeleteAccountInput,
} from '#src/use-cases/user/IDeleteAccountUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  documentRepository: IDocumentRepository;
  storageProvider: IStorageProvider;
}

export class DeleteAccountUseCase implements IDeleteAccountUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');
    assertHasPassword(user.passwordHash);

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid password');

    if (user.totpEnabled && !isSessionFresh(input.authTime)) {
      throw new StepUpRequiredError('Please verify your identity again to continue.');
    }

    // Blobs before rows, same as PermanentlyDeleteApplicationUseCase: once
    // the user row cascades away, the documents' storage keys go with it,
    // and nothing would ever notice the orphaned files left behind.
    const documents = await this.deps.documentRepository.findAllByUserId(input.userId);
    await this.deps.storageProvider.deleteMany(documents.map((doc) => doc.storageKey));

    await this.deps.userRepository.delete(input.userId);
  }
}
