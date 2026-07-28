import { eq, asc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { User } from '#src/domain/user/User.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { user } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleUserRepository implements IUserRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.database.select().from(user).where(eq(user.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.database.select().from(user).where(eq(user.email, email));
    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.database.select().from(user).orderBy(asc(user.createdAt));
    return rows.map(this.toEntity);
  }

  async create(data: {
    id: string;
    email: string;
    passwordHash?: string | null;
    name?: string | null;
    emailVerifiedAt?: Date | null;
  }): Promise<User> {
    const now = new Date();
    const row = {
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash ?? null,
      name: data.name ?? null,
      timezone: null,
      targetRole: null,
      emailVerifiedAt: data.emailVerifiedAt ?? null,
      avatarKey: null,
      weeklyDigestEnabled: true,
      lastDigestSentAt: null,
      followUpRemindersEnabled: true,
      totpSecret: null,
      totpEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.insert(user).values(row);
    return this.toEntity(row);
  }

  async update(
    id: string,
    data: {
      email?: string;
      passwordHash?: string;
      name?: string | null;
      timezone?: string | null;
      targetRole?: string | null;
      emailVerifiedAt?: Date | null;
      avatarKey?: string | null;
      weeklyDigestEnabled?: boolean;
      followUpRemindersEnabled?: boolean;
      totpSecret?: string | null;
      totpEnabled?: boolean;
    },
  ): Promise<User> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.email !== undefined) updateData.email = data.email;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.targetRole !== undefined) updateData.targetRole = data.targetRole;
    if (data.emailVerifiedAt !== undefined) updateData.emailVerifiedAt = data.emailVerifiedAt;
    if (data.avatarKey !== undefined) updateData.avatarKey = data.avatarKey;
    if (data.weeklyDigestEnabled !== undefined)
      updateData.weeklyDigestEnabled = data.weeklyDigestEnabled;
    if (data.followUpRemindersEnabled !== undefined)
      updateData.followUpRemindersEnabled = data.followUpRemindersEnabled;
    if (data.totpSecret !== undefined) updateData.totpSecret = data.totpSecret;
    if (data.totpEnabled !== undefined) updateData.totpEnabled = data.totpEnabled;

    await this.database.update(user).set(updateData).where(eq(user.id, id));
    const [row] = await this.database.select().from(user).where(eq(user.id, id));
    return this.toEntity(row!);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(user).where(eq(user.id, id));
  }

  async updateLastDigestSentAt(id: string, sentAt: Date): Promise<void> {
    await this.database
      .update(user)
      .set({ lastDigestSentAt: sentAt, updatedAt: new Date() })
      .where(eq(user.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash ?? null,
      name: row.name ?? null,
      timezone: row.timezone ?? null,
      targetRole: row.targetRole ?? null,
      emailVerifiedAt: row.emailVerifiedAt ?? null,
      avatarKey: row.avatarKey ?? null,
      weeklyDigestEnabled: row.weeklyDigestEnabled,
      lastDigestSentAt: row.lastDigestSentAt ?? null,
      followUpRemindersEnabled: row.followUpRemindersEnabled,
      totpSecret: row.totpSecret ?? null,
      totpEnabled: row.totpEnabled,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
