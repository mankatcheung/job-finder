import { eq, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { education } from '../schema.js';
import type { Education } from '#src/domain/education/Education.js';
import type {
  IEducationRepository,
  CreateEducationData,
  UpdateEducationData,
} from '#src/use-cases/ports/IEducationRepository.js';
import { getClient } from '../transactionContext.js';

type Row = typeof education.$inferSelect;

export class DrizzleEducationRepository implements IEducationRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findAllByUserId(userId: string): Promise<Education[]> {
    const rows = await this.db
      .select()
      .from(education)
      .where(eq(education.userId, userId))
      .orderBy(desc(education.startDate), desc(education.id));
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Education | null> {
    const [row] = await this.db.select().from(education).where(eq(education.id, id)).limit(1);
    if (!row) return null;
    return this.toEntity(row);
  }

  async create(data: CreateEducationData): Promise<Education> {
    const [row] = await this.db
      .insert(education)
      .values({
        id: data.id,
        userId: data.userId,
        institution: data.institution,
        degree: data.degree ?? null,
        field: data.field ?? null,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        description: data.description ?? null,
      })
      .returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateEducationData): Promise<Education> {
    const [row] = await this.db
      .update(education)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(education.id, id))
      .returning();
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(education).where(eq(education.id, id));
  }

  private toEntity(row: Row): Education {
    return {
      id: row.id,
      userId: row.userId,
      institution: row.institution,
      degree: row.degree,
      field: row.field,
      startDate: row.startDate,
      endDate: row.endDate,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
