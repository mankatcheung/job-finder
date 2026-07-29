import type { PrismaClient, Prisma } from '#src/generated/prisma/client.js';
import type { Application } from '#src/domain/application/Application.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import type {
  IApplicationRepository,
  CreateApplicationData,
  UpdateApplicationData,
  FindApplicationsPageFilters,
  FindApplicationsPagePagination,
  ApplicationsPage,
} from '#src/use-cases/ports/IApplicationRepository.js';
import { txStorage, getClient } from '../transactionContext.js';
import { REMINDER_WINDOW_MS } from '#src/constants.js';

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
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
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

  async findPageByUserId(
    userId: string,
    filters: FindApplicationsPageFilters,
    pagination: FindApplicationsPagePagination,
  ): Promise<ApplicationsPage> {
    const search = filters.search?.trim();
    const { limit, cursor } = pagination;

    const rows = await this.db.jobApplication.findMany({
      where: {
        userId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.starred ? { starred: true } : {}),
        ...(search
          ? {
              OR: [
                { company: { contains: search } },
                { role: { contains: search } },
                { location: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {}),
      },
      include: INCLUDE_TAGS,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    return { items: items.map(this.toEntity), hasNextPage };
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

    const exec = async (client: Prisma.TransactionClient) => {
      const app = await client.jobApplication.create({
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
      for (const tag of tags) {
        await client.applicationTag.create({
          data: { id: tag.id, applicationId: app.id, name: tag.name },
        });
      }
      return client.jobApplication.findUnique({ where: { id: app.id }, include: INCLUDE_TAGS });
    };

    const ambient = txStorage.getStore();
    const row = ambient ? await exec(ambient) : await this.prisma.$transaction(exec);
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
      const exec = async (client: Prisma.TransactionClient) => {
        await client.jobApplication.update({ where: { id }, data: scalarData });
        await client.applicationTag.deleteMany({ where: { applicationId: id } });
        for (const tag of data.tags!) {
          await client.applicationTag.create({
            data: { id: tag.id, applicationId: id, name: tag.name },
          });
        }
        return client.jobApplication.findUnique({ where: { id }, include: INCLUDE_TAGS });
      };

      const ambient = txStorage.getStore();
      const row = ambient ? await exec(ambient) : await this.prisma.$transaction(exec);
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
    const in24h = new Date(now.getTime() + REMINDER_WINDOW_MS.DUE_WITHIN);
    const rows = await this.db.jobApplication.findMany({
      where: {
        followUpAt: { gte: now, lte: in24h },
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lte: new Date(now.getTime() - REMINDER_WINDOW_MS.RESEND_AFTER) } },
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
