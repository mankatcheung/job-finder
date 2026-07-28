import { nanoid } from 'nanoid';
import { eq, and, or, desc, like, lte, gte, lt } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
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
import { jobApplication, applicationTag } from '../drizzle/schema.js';
import { txStorage, getDb } from '../transactionContext.js';
import { REMINDER_WINDOW_MS } from '#src/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleApplicationRepository implements IApplicationRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findAllByUserId(
    userId: string,
    filters?: { status?: ApplicationStatus },
  ): Promise<Application[]> {
    const conditions = [eq(jobApplication.userId, userId)];
    if (filters?.status) {
      conditions.push(eq(jobApplication.status, filters.status));
    }

    const rows = await this.database
      .select()
      .from(jobApplication)
      .where(and(...conditions))
      .orderBy(desc(jobApplication.createdAt));

    const result: Application[] = [];
    for (const row of rows) {
      const tags = await this.getTags(row.id);
      result.push(this.toEntity(row, tags));
    }
    return result;
  }

  async findPageByUserId(
    userId: string,
    filters: FindApplicationsPageFilters,
    pagination: FindApplicationsPagePagination,
  ): Promise<ApplicationsPage> {
    const search = filters.search?.trim();
    const { limit, cursor } = pagination;

    const conditions = [eq(jobApplication.userId, userId)];
    if (filters.status) {
      conditions.push(eq(jobApplication.status, filters.status));
    }
    if (filters.starred) {
      conditions.push(eq(jobApplication.starred, true));
    }
    if (search) {
      conditions.push(
        or(
          like(jobApplication.company, `%${search}%`),
          like(jobApplication.role, `%${search}%`),
          like(jobApplication.location, `%${search}%`),
          like(jobApplication.description, `%${search}%`),
        )!,
      );
    }

    let query = this.database
      .select()
      .from(jobApplication)
      .where(and(...conditions))
      .orderBy(desc(jobApplication.createdAt), desc(jobApplication.id))
      .limit(limit + 1);

    if (cursor) {
      const [cursorRow] = await this.database
        .select({ createdAt: jobApplication.createdAt, id: jobApplication.id })
        .from(jobApplication)
        .where(eq(jobApplication.id, cursor));

      if (cursorRow) {
        conditions.push(
          or(
            lt(jobApplication.createdAt, cursorRow.createdAt),
            and(
              eq(jobApplication.createdAt, cursorRow.createdAt),
              lt(jobApplication.id, cursorRow.id),
            ),
          )!,
        );
        query = this.database
          .select()
          .from(jobApplication)
          .where(and(...conditions))
          .orderBy(desc(jobApplication.createdAt), desc(jobApplication.id))
          .limit(limit + 1);
      }
    }

    const rows = await query;
    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    const result: Application[] = [];
    for (const row of items) {
      const tags = await this.getTags(row.id);
      result.push(this.toEntity(row, tags));
    }
    return { items: result, hasNextPage };
  }

  async findById(id: string): Promise<Application | null> {
    const [row] = await this.database
      .select()
      .from(jobApplication)
      .where(eq(jobApplication.id, id));
    if (!row) return null;
    const tags = await this.getTags(id);
    return this.toEntity(row, tags);
  }

  async create(data: CreateApplicationData): Promise<Application> {
    const tags = data.tags ?? [];

    const exec = async (txDb: DrizzleDb) => {
      const now = new Date();
      const appRow = {
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
        createdAt: now,
        updatedAt: now,
      };
      await txDb.insert(jobApplication).values(appRow);

      for (const name of tags) {
        await txDb.insert(applicationTag).values({
          id: nanoid(),
          applicationId: appRow.id,
          name,
        });
      }

      const [result] = await txDb
        .select()
        .from(jobApplication)
        .where(eq(jobApplication.id, appRow.id));
      return result!;
    };

    const ambient = txStorage.getStore();
    let result: typeof jobApplication.$inferSelect;
    if (ambient) {
      result = await exec(ambient);
    } else {
      await this.db.transaction(async (tx) => {
        result = await exec(tx);
      });
    }

    const resultTags = await this.getTags(result!.id);
    return this.toEntity(result!, resultTags);
  }

  async update(id: string, data: UpdateApplicationData): Promise<Application> {
    if (data.tags !== undefined) {
      const exec = async (txDb: DrizzleDb) => {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (data.company !== undefined) updateData.company = data.company;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl;
        if (data.location !== undefined) updateData.location = data.location;
        if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.appliedAt !== undefined) updateData.appliedAt = data.appliedAt;
        if (data.starred !== undefined) updateData.starred = data.starred;
        if (data.source !== undefined) updateData.source = data.source;
        if (data.followUpAt !== undefined) updateData.followUpAt = data.followUpAt;

        await txDb.update(jobApplication).set(updateData).where(eq(jobApplication.id, id));
        await txDb.delete(applicationTag).where(eq(applicationTag.applicationId, id));
        for (const name of data.tags!) {
          await txDb.insert(applicationTag).values({
            id: nanoid(),
            applicationId: id,
            name,
          });
        }
      };

      const ambient = txStorage.getStore();
      if (ambient) {
        await exec(ambient);
      } else {
        await this.db.transaction(async (tx) => {
          await exec(tx);
        });
      }

      const [row] = await this.database
        .select()
        .from(jobApplication)
        .where(eq(jobApplication.id, id));
      const tags = await this.getTags(id);
      return this.toEntity(row!, tags);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.company !== undefined) updateData.company = data.company;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.appliedAt !== undefined) updateData.appliedAt = data.appliedAt;
    if (data.starred !== undefined) updateData.starred = data.starred;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.followUpAt !== undefined) updateData.followUpAt = data.followUpAt;

    await this.database.update(jobApplication).set(updateData).where(eq(jobApplication.id, id));
    const [row] = await this.database
      .select()
      .from(jobApplication)
      .where(eq(jobApplication.id, id));
    const tags = await this.getTags(id);
    return this.toEntity(row!, tags);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(jobApplication).where(eq(jobApplication.id, id));
  }

  async findDueForReminder(): Promise<Application[]> {
    const now = new Date();
    const in24h = new Date(now.getTime() + REMINDER_WINDOW_MS.DUE_WITHIN);
    const resendCutoff = new Date(now.getTime() - REMINDER_WINDOW_MS.RESEND_AFTER);

    const rows = await this.database
      .select()
      .from(jobApplication)
      .where(
        and(
          gte(jobApplication.followUpAt, now),
          lte(jobApplication.followUpAt, in24h),
          or(
            eq(jobApplication.reminderSentAt, null as unknown as Date),
            lte(jobApplication.reminderSentAt, resendCutoff),
          ),
        ),
      );

    const result: Application[] = [];
    for (const row of rows) {
      const tags = await this.getTags(row.id);
      result.push(this.toEntity(row, tags));
    }
    return result;
  }

  async updateReminderSentAt(id: string, sentAt: Date): Promise<void> {
    await this.database
      .update(jobApplication)
      .set({ reminderSentAt: sentAt })
      .where(eq(jobApplication.id, id));
  }

  private async getTags(applicationId: string): Promise<string[]> {
    const tags = await this.database
      .select({ name: applicationTag.name })
      .from(applicationTag)
      .where(eq(applicationTag.applicationId, applicationId));
    return tags.map((t) => t.name);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any, tags: string[]): Application {
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
      tags,
      reminderSentAt: row.reminderSentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
