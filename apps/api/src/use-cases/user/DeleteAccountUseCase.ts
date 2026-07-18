import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IDeleteAccountUseCase, DeleteAccountInput } from '@/use-cases/user/IDeleteAccountUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class DeleteAccountUseCase implements IDeleteAccountUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid password'), { code: 'UNAUTHORIZED' });

    await this.deps.userRepository.delete(input.userId);
  }
}
