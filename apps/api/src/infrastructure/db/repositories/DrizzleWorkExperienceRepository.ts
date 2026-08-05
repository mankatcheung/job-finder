import { eq, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { workExperience } from '../schema.js';
import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';
import type {
  IWorkExperienceRepository,
  CreateWorkExperienceData,
  UpdateWorkExperienceData,
} from '#src/use-cases/ports/IWorkExperienceRepository.js';
import { getClient } from '../transactionContext.js';

type Row = typeof workExperience.$inferSelect;

export class DrizzleWorkExperienceRepository implements IWorkExperienceRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findAllByUserId(userId: string): Promise<WorkExperience[]> {
    const rows = await this.db
      .select()
      .from(workExperience)
      .where(eq(workExperience.userId, userId))
      .orderBy(desc(workExperience.startDate), desc(workExperience.id));
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<WorkExperience | null> {
    const [row] = await this.db
      .select()
      .from(workExperience)
      .where(eq(workExperience.id, id))
      .limit(1);
    if (!row) return null;
    return this.toEntity(row);
  }

  async create(data: CreateWorkExperienceData): Promise<WorkExperience> {
    const [row] = await this.db
      .insert(workExperience)
      .values({
        id: data.id,
        userId: data.userId,
        company: data.company,
        title: data.title,
        location: data.location ?? null,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        description: data.description ?? null,
      })
      .returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateWorkExperienceData): Promise<WorkExperience> {
    const [row] = await this.db
      .update(workExperience)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workExperience.id, id))
      .returning();
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(workExperience).where(eq(workExperience.id, id));
  }

  private toEntity(row: Row): WorkExperience {
    return {
      id: row.id,
      userId: row.userId,
      company: row.company,
      title: row.title,
      location: row.location,
      startDate: row.startDate,
      endDate: row.endDate,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
