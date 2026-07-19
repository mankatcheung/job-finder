import { createHash, randomBytes } from 'crypto';
import type { IApiTokenRepository } from '@/use-cases/ports/IApiTokenRepository.js';
import type { ApiToken } from '@/domain/apiToken/ApiToken.js';

interface Deps {
  apiTokenRepository: IApiTokenRepository;
  generateId: () => string;
}

export interface CreateApiTokenInput {
  userId: string;
  name: string;
}

export interface CreateApiTokenOutput {
  token: ApiToken;
  rawToken: string;
}

export class CreateApiTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateApiTokenInput): Promise<CreateApiTokenOutput> {
    const rawToken = `jfat_${randomBytes(24).toString('hex')}`;
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.deps.apiTokenRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      name: input.name,
      tokenHash,
    });

    return { token, rawToken };
  }
}
