import { eq, desc, sql } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { note } from '../schema.js';
import type { Note } from '#src/domain/note/Note.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleNoteRepository implements INoteRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async countByApplicationId(applicationId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(note)
      .where(eq(note.applicationId, applicationId));
    return Number(row?.count ?? 0);
  }

  async findAllByApplicationId(applicationId: string): Promise<Note[]> {
    const rows = await this.db
      .select()
      .from(note)
      .where(eq(note.applicationId, applicationId))
      .orderBy(desc(note.createdAt));
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Note | null> {
    const [row] = await this.db.select().from(note).where(eq(note.id, id)).limit(1);
    return row ? this.toEntity(row) : null;
  }

  async create(data: { id: string; applicationId: string; content: string }): Promise<Note> {
    const [row] = await this.db.insert(note).values(data).returning();
    return this.toEntity(row);
  }

  async update(id: string, content: string): Promise<Note> {
    const [row] = await this.db.update(note).set({ content }).where(eq(note.id, id)).returning();
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(note).where(eq(note.id, id));
  }

  private toEntity(row: typeof note.$inferSelect): Note {
    return {
      id: row.id,
      applicationId: row.applicationId,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
