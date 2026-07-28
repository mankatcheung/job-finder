import { eq, and, gt, inArray } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { Session } from '#src/domain/session/Session.js';
import type {
  ISessionRepository,
  CreateSessionData,
} from '#src/use-cases/ports/ISessionRepository.js';
import { session } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleSessionRepository implements ISessionRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async create(data: CreateSessionData): Promise<Session> {
    const now = new Date();
    const row = {
      id: data.id,
      userId: data.userId,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      lastUsedAt: now,
      createdAt: now,
      expiresAt: data.expiresAt,
    };
    await this.database.insert(session).values(row);
    return this.toEntity(row);
  }

  async findById(id: string): Promise<Session | null> {
    const [row] = await this.database.select().from(session).where(eq(session.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Session | null> {
    const [row] = await this.database
      .select()
      .from(session)
      .where(and(eq(session.id, id), eq(session.userId, userId)));
    return row ? this.toEntity(row) : null;
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const now = new Date();
    const rows = await this.database
      .select()
      .from(session)
      .where(
        and(
          eq(session.userId, userId),
          eq(session.revokedAt, null as unknown as Date),
          gt(session.expiresAt, now),
        ),
      );
    return rows.map(this.toEntity);
  }

  async touch(id: string, expiresAt: Date): Promise<void> {
    await this.database
      .update(session)
      .set({ lastUsedAt: new Date(), expiresAt })
      .where(eq(session.id, id));
  }

  async revoke(id: string): Promise<void> {
    await this.database.update(session).set({ revokedAt: new Date() }).where(eq(session.id, id));
  }

  async revokeAllForUserExcept(userId: string, exceptId: string): Promise<void> {
    const now = new Date();
    const activeSessions = await this.database
      .select({ id: session.id })
      .from(session)
      .where(and(eq(session.userId, userId), eq(session.revokedAt, null as unknown as Date)));
    const idsToRevoke = activeSessions.map((s) => s.id).filter((id) => id !== exceptId);
    if (idsToRevoke.length === 0) return;
    await this.database
      .update(session)
      .set({ revokedAt: now })
      .where(inArray(session.id, idsToRevoke));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const now = new Date();
    await this.database
      .update(session)
      .set({ revokedAt: now })
      .where(and(eq(session.userId, userId), eq(session.revokedAt, null as unknown as Date)));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): Session {
    return {
      id: row.id,
      userId: row.userId,
      userAgent: row.userAgent ?? null,
      ipAddress: row.ipAddress ?? null,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt ?? null,
    };
  }
}
