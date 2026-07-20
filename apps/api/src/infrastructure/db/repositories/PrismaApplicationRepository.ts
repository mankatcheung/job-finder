import { nanoid } from 'nanoid';
import type { PrismaClient } from '@prisma/client';
import type { Application } from '@/domain/application/Application.js';
import type { ApplicationStatus } from '@/domain/application/ApplicationStatus.js';
import type {
  IApplicationRepository,
  CreateApplicationData,
  UpdateApplicationData,
} from '@/use-cases/ports/IApplicationRepository.js';

type PrismaTag = { id: string; applicationId: string; name: string };

type PrismaApp = {
  id: string;
  userId: string;
  company: string;
  role: string;
  status: string;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  appliedAt: Date | null;
  starred: boolean;
  source: string | null;
  followUpAt: Date | null;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: PrismaTag[];
};

const INCLUDE_TAGS = { tags: true } as const;

export class PrismaApplicationRepository implements IApplicationRepository {
  private readonly db: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.db = prisma;
  }

  async findAllByUserId(
    userId: string,
    filters?: { status?: ApplicationStatus },
  ): Promise<Application[]> {
    const rows = await this.db.jobApplication.findMany({
      where: {
        userId,
        ...(filters?.status ? { status: filters.status } : {}),
      },
      include: INCLUDE_TAGS,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<Application | null> {
    const row = await this.db.jobApplication.findUnique({
      where: { id },
      include: INCLUDE_TAGS,
    });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateApplicationData): Promise<Application> {
    const tags = data.tags ?? [];
    const row = await this.db.$transaction(async (tx) => {
      const app = await tx.jobApplication.create({
        data: {
          id: data.id,
          userId: data.userId,
          company: data.company,
          role: data.role,
          status: data.status,
          jobUrl: data.jobUrl ?? null,
          location: data.location ?? null,
          salaryRange: data.salaryRange ?? null,
          description: data.description ?? null,
          starred: data.starred ?? false,
          source: data.source ?? null,
          followUpAt: data.followUpAt ?? null,
        },
      });
      for (const name of tags) {
        await tx.applicationTag.create({ data: { id: nanoid(), applicationId: app.id, name } });
      }
      return tx.jobApplication.findUnique({ where: { id: app.id }, include: INCLUDE_TAGS });
    });
    return this.toEntity(row!);
  }

  async update(id: string, data: UpdateApplicationData): Promise<Application> {
    const scalarData = {
      ...(data.company !== undefined ? { company: data.company } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.jobUrl !== undefined ? { jobUrl: data.jobUrl } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.salaryRange !== undefined ? { salaryRange: data.salaryRange } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.appliedAt !== undefined ? { appliedAt: data.appliedAt } : {}),
      ...(data.starred !== undefined ? { starred: data.starred } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.followUpAt !== undefined ? { followUpAt: data.followUpAt } : {}),
    };

    if (data.tags !== undefined) {
      const row = await this.db.$transaction(async (tx) => {
        await tx.jobApplication.update({ where: { id }, data: scalarData });
        await tx.applicationTag.deleteMany({ where: { applicationId: id } });
        for (const name of data.tags!) {
          await tx.applicationTag.create({ data: { id: nanoid(), applicationId: id, name } });
        }
        return tx.jobApplication.findUnique({ where: { id }, include: INCLUDE_TAGS });
      });
      return this.toEntity(row!);
    }

    const row = await this.db.jobApplication.update({
      where: { id },
      data: scalarData,
      include: INCLUDE_TAGS,
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.jobApplication.delete({ where: { id } });
  }

  async findDueForReminder(): Promise<Application[]> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const rows = await this.db.jobApplication.findMany({
      where: {
        followUpAt: { gte: now, lte: in24h },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lte: new Date(now.getTime() - 23 * 60 * 60 * 1000) } },
        ],
      },
      include: INCLUDE_TAGS,
    });
    return rows.map(this.toEntity);
  }

  async updateReminderSentAt(id: string, sentAt: Date): Promise<void> {
    await this.db.jobApplication.update({ where: { id }, data: { reminderSentAt: sentAt } });
  }

  private toEntity(row: PrismaApp): Application {
    return {
      id: row.id,
      userId: row.userId,
      company: row.company,
      role: row.role,
      status: row.status as ApplicationStatus,
      jobUrl: row.jobUrl,
      location: row.location,
      salaryRange: row.salaryRange,
      description: row.description,
      appliedAt: row.appliedAt,
      starred: row.starred,
      source: row.source,
      followUpAt: row.followUpAt,
      tags: row.tags?.map((t: { name: string }) => t.name) ?? [],
      reminderSentAt: row.reminderSentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
