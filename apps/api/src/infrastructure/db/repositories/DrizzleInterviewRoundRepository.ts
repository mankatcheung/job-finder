import { eq, asc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { InterviewRound } from '#src/domain/interviewRound/InterviewRound.js';
import type {
  IInterviewRoundRepository,
  CreateInterviewRoundData,
  UpdateInterviewRoundData,
} from '#src/use-cases/ports/IInterviewRoundRepository.js';
import { interviewRound } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleInterviewRoundRepository implements IInterviewRoundRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findAllByApplicationId(applicationId: string): Promise<InterviewRound[]> {
    const rows = await this.database
      .select()
      .from(interviewRound)
      .where(eq(interviewRound.applicationId, applicationId))
      .orderBy(asc(interviewRound.createdAt));
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<InterviewRound | null> {
    const [row] = await this.database
      .select()
      .from(interviewRound)
      .where(eq(interviewRound.id, id));
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateInterviewRoundData): Promise<InterviewRound> {
    const now = new Date();
    const row = {
      id: data.id,
      applicationId: data.applicationId,
      type: data.type ?? 'other',
      scheduledAt: data.scheduledAt ?? null,
      completedAt: data.completedAt ?? null,
      interviewerName: data.interviewerName ?? null,
      notes: data.notes ?? null,
      outcome: data.outcome ?? 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await this.database.insert(interviewRound).values(row);
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateInterviewRoundData): Promise<InterviewRound> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.type !== undefined) updateData.type = data.type;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    if (data.interviewerName !== undefined) updateData.interviewerName = data.interviewerName;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.outcome !== undefined) updateData.outcome = data.outcome;

    await this.database.update(interviewRound).set(updateData).where(eq(interviewRound.id, id));
    const [row] = await this.database
      .select()
      .from(interviewRound)
      .where(eq(interviewRound.id, id));
    return this.toEntity(row!);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(interviewRound).where(eq(interviewRound.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): InterviewRound {
    return {
      id: row.id,
      applicationId: row.applicationId,
      type: row.type,
      scheduledAt: row.scheduledAt ?? null,
      completedAt: row.completedAt ?? null,
      interviewerName: row.interviewerName ?? null,
      notes: row.notes ?? null,
      outcome: row.outcome,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
