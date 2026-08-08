import { eq, and, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { shareLink } from '../schema.js';
import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';
import { getClient } from '../transactionContext.js';
import type {
  IShareLinkRepository,
  CreateShareLinkData,
} from '#src/use-cases/ports/IShareLinkRepository.js';

export class DrizzleShareLinkRepository implements IShareLinkRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findAllByUserId(userId: string): Promise<ShareLink[]> {
    const rows = await this.db
      .select()
      .from(shareLink)
      .where(eq(shareLink.userId, userId))
      .orderBy(desc(shareLink.createdAt));
    return rows.map((r) => this.toEntity(r));
  }

  async findByTokenHash(tokenHash: string): Promise<ShareLink | null> {
    const [row] = await this.db
      .select()
      .from(shareLink)
      .where(eq(shareLink.tokenHash, tokenHash))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ShareLink | null> {
    const [row] = await this.db
      .select()
      .from(shareLink)
      .where(and(eq(shareLink.id, id), eq(shareLink.userId, userId)))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateShareLinkData): Promise<ShareLink> {
    const [row] = await this.db
      .insert(shareLink)
      .values({
        id: data.id,
        userId: data.userId,
        name: data.name,
        tokenHash: data.tokenHash,
      })
      .returning();
    return this.toEntity(row);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db.update(shareLink).set({ lastUsedAt: new Date() }).where(eq(shareLink.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(shareLink).where(eq(shareLink.id, id));
  }

  private toEntity(row: typeof shareLink.$inferSelect): ShareLink {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      tokenHash: row.tokenHash,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    };
  }
}
