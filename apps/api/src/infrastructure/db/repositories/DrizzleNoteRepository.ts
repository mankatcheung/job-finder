import { eq, desc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { Note } from '#src/domain/note/Note.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import { note } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleNoteRepository implements INoteRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findAllByApplicationId(applicationId: string): Promise<Note[]> {
    const rows = await this.database
      .select()
      .from(note)
      .where(eq(note.applicationId, applicationId))
      .orderBy(desc(note.createdAt));
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<Note | null> {
    const [row] = await this.database.select().from(note).where(eq(note.id, id));
    return row ? this.toEntity(row) : null;
  }

  async create(data: { id: string; applicationId: string; content: string }): Promise<Note> {
    const now = new Date();
    const row = {
      id: data.id,
      applicationId: data.applicationId,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.insert(note).values(row);
    return this.toEntity(row);
  }

  async update(id: string, content: string): Promise<Note> {
    await this.database.update(note).set({ content, updatedAt: new Date() }).where(eq(note.id, id));
    const [row] = await this.database.select().from(note).where(eq(note.id, id));
    return this.toEntity(row!);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(note).where(eq(note.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): Note {
    return {
      id: row.id,
      applicationId: row.applicationId,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
