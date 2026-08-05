import { asc, eq, and } from 'drizzle-orm';
import type { DrizzleClient, DrizzleDb } from '../client.js';
import { getClient } from '../transactionContext.js';
import { pipelineStage } from '../schema.js';
import type { PipelineStage } from '#src/domain/pipelineStage/PipelineStage.js';
import type {
  CreatePipelineStageData,
  IPipelineStageRepository,
  UpdatePipelineStageData,
} from '#src/use-cases/ports/IPipelineStageRepository.js';

export class DrizzlePipelineStageRepository implements IPipelineStageRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  private toEntity(row: typeof pipelineStage.$inferSelect): PipelineStage {
    return {
      ...row,
      category: row.category as PipelineStage['category'],
    };
  }

  async findAllByUserId(userId: string): Promise<PipelineStage[]> {
    const rows = await this.db
      .select()
      .from(pipelineStage)
      .where(eq(pipelineStage.userId, userId))
      .orderBy(asc(pipelineStage.position));
    return rows.map((row) => this.toEntity(row));
  }

  async findById(id: string): Promise<PipelineStage | null> {
    const [row] = await this.db.select().from(pipelineStage).where(eq(pipelineStage.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findByKey(userId: string, key: string): Promise<PipelineStage | null> {
    const [row] = await this.db
      .select()
      .from(pipelineStage)
      .where(and(eq(pipelineStage.userId, userId), eq(pipelineStage.key, key)));
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreatePipelineStageData): Promise<PipelineStage> {
    const [row] = await this.db.insert(pipelineStage).values(data).returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdatePipelineStageData): Promise<PipelineStage> {
    const [row] = await this.db
      .update(pipelineStage)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pipelineStage.id, id))
      .returning();
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(pipelineStage).where(eq(pipelineStage.id, id));
  }
}
