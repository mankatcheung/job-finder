import { eq, and, ne, isNull, gt, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { session } from '../schema.js';
import type { Session } from '#src/domain/session/Session.js';
import { getClient } from '../transactionContext.js';
import type {
  ISessionRepository,
  CreateSessionData,
  RotateRefreshTokenData,
} from '#src/use-cases/ports/ISessionRepository.js';

export class DrizzleSessionRepository implements ISessionRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateSessionData): Promise<Session> {
    const [row] = await this.db.insert(session).values(data).returning();
    return this.toEntity(row);
  }

  async findById(id: string): Promise<Session | null> {
    const [row] = await this.db.select().from(session).where(eq(session.id, id)).limit(1);
    return row ? this.toEntity(row) : null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Session | null> {
    const [row] = await this.db
      .select()
      .from(session)
      .where(and(eq(session.id, id), eq(session.userId, userId)))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db
      .select()
      .from(session)
      .where(
        and(
          eq(session.userId, userId),
          isNull(session.revokedAt),
          gt(session.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(session.lastUsedAt));
    return rows.map((r) => this.toEntity(r));
  }

  async touch(id: string, expiresAt: Date): Promise<void> {
    await this.db
      .update(session)
      .set({ lastUsedAt: new Date(), expiresAt })
      .where(eq(session.id, id));
  }

  async rotateRefreshToken(id: string, data: RotateRefreshTokenData): Promise<void> {
    await this.db
      .update(session)
      .set({
        lastUsedAt: new Date(),
        expiresAt: data.expiresAt,
        currentRefreshTokenId: data.currentRefreshTokenId,
        previousRefreshTokenId: data.previousRefreshTokenId,
        previousRotatedAt: data.previousRotatedAt,
      })
      .where(eq(session.id, id));
  }

  async revoke(id: string): Promise<void> {
    await this.db.update(session).set({ revokedAt: new Date() }).where(eq(session.id, id));
  }

  async revokeAllForUserExcept(userId: string, exceptId: string): Promise<void> {
    await this.db
      .update(session)
      .set({ revokedAt: new Date() })
      .where(and(eq(session.userId, userId), ne(session.id, exceptId), isNull(session.revokedAt)));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(session)
      .set({ revokedAt: new Date() })
      .where(and(eq(session.userId, userId), isNull(session.revokedAt)));
  }

  async findDistinctUserAgentsByUserId(userId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userAgent: session.userAgent })
      .from(session)
      .where(eq(session.userId, userId));
    return rows.map((r) => r.userAgent).filter((ua): ua is string => ua !== null);
  }

  private toEntity(row: typeof session.$inferSelect): Session {
    return {
      id: row.id,
      userId: row.userId,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      deviceLabel: row.deviceLabel,
      location: row.location,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      currentRefreshTokenId: row.currentRefreshTokenId,
      previousRefreshTokenId: row.previousRefreshTokenId,
      previousRotatedAt: row.previousRotatedAt,
    };
  }
}
