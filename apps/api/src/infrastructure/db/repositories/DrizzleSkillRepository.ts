import { eq, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { skill } from '../schema.js';
import type { Skill } from '#src/domain/skill/Skill.js';
import type {
  ISkillRepository,
  CreateSkillData,
  UpdateSkillData,
} from '#src/use-cases/ports/ISkillRepository.js';
import { getClient } from '../transactionContext.js';

type Row = typeof skill.$inferSelect;

export class DrizzleSkillRepository implements ISkillRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findAllByUserId(userId: string): Promise<Skill[]> {
    const rows = await this.db
      .select()
      .from(skill)
      .where(eq(skill.userId, userId))
      .orderBy(desc(skill.createdAt), desc(skill.id));
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Skill | null> {
    const [row] = await this.db.select().from(skill).where(eq(skill.id, id)).limit(1);
    if (!row) return null;
    return this.toEntity(row);
  }

  async create(data: CreateSkillData): Promise<Skill> {
    const [row] = await this.db
      .insert(skill)
      .values({
        id: data.id,
        userId: data.userId,
        name: data.name,
        category: data.category ?? null,
        proficiency: data.proficiency ?? null,
      })
      .returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateSkillData): Promise<Skill> {
    const [row] = await this.db.update(skill).set(data).where(eq(skill.id, id)).returning();
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(skill).where(eq(skill.id, id));
  }

  private toEntity(row: Row): Skill {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      category: row.category,
      proficiency: row.proficiency,
      createdAt: row.createdAt,
    };
  }
}
