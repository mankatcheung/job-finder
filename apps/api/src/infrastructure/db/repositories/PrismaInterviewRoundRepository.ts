import type { PrismaClient } from '@prisma/client';
import type { InterviewRound, InterviewRoundType, InterviewRoundOutcome } from '@/domain/interviewRound/InterviewRound.js';
import { getClient } from '../transactionContext.js';
import type {
  IInterviewRoundRepository,
  CreateInterviewRoundData,
  UpdateInterviewRoundData,
} from '@/use-cases/ports/IInterviewRoundRepository.js';

type PrismaRound = {
  id: string;
  applicationId: string;
  type: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  interviewerName: string | null;
  notes: string | null;
  outcome: string;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaInterviewRoundRepository implements IInterviewRoundRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async findAllByApplicationId(applicationId: string): Promise<InterviewRound[]> {
    const rows = await this.db.interviewRound.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<InterviewRound | null> {
    const row = await this.db.interviewRound.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateInterviewRoundData): Promise<InterviewRound> {
    const row = await this.db.interviewRound.create({
      data: {
        id: data.id,
        applicationId: data.applicationId,
        type: data.type,
        scheduledAt: data.scheduledAt ?? null,
        completedAt: data.completedAt ?? null,
        interviewerName: data.interviewerName ?? null,
        notes: data.notes ?? null,
        outcome: data.outcome ?? 'pending',
      },
    });
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateInterviewRoundData): Promise<InterviewRound> {
    const row = await this.db.interviewRound.update({
      where: { id },
      data: {
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(data.interviewerName !== undefined ? { interviewerName: data.interviewerName } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.outcome !== undefined ? { outcome: data.outcome } : {}),
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.interviewRound.delete({ where: { id } });
  }

  private toEntity(row: PrismaRound): InterviewRound {
    return {
      id: row.id,
      applicationId: row.applicationId,
      type: row.type as InterviewRoundType,
      scheduledAt: row.scheduledAt,
      completedAt: row.completedAt,
      interviewerName: row.interviewerName,
      notes: row.notes,
      outcome: row.outcome as InterviewRoundOutcome,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
