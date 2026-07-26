import type { PrismaClient } from '@prisma/client';
import type { OAuthAccount, OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthAccountRepository } from '#src/use-cases/ports/IOAuthAccountRepository.js';
import { getClient } from '../transactionContext.js';

type PrismaOAuthAccount = {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  email: string | null;
  createdAt: Date;
};

export class PrismaOAuthAccountRepository implements IOAuthAccountRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async findByProvider(
    provider: OAuthProviderName,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    const row = await this.db.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAllByUserId(userId: string): Promise<OAuthAccount[]> {
    const rows = await this.db.oAuthAccount.findMany({ where: { userId } });
    return rows.map((r: PrismaOAuthAccount) => this.toEntity(r));
  }

  async create(data: {
    id: string;
    userId: string;
    provider: OAuthProviderName;
    providerAccountId: string;
    email: string | null;
  }): Promise<OAuthAccount> {
    const row = await this.db.oAuthAccount.create({ data });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.oAuthAccount.delete({ where: { id } });
  }

  private toEntity(row: PrismaOAuthAccount): OAuthAccount {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider as OAuthProviderName,
      providerAccountId: row.providerAccountId,
      email: row.email,
      createdAt: row.createdAt,
    };
  }
}
