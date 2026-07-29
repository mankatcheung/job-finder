import { nanoid } from 'nanoid';
import { eq, and, or, desc, gte, lte, lt, like, isNull, inArray } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { jobApplication, applicationTag } from '../schema.js';
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

type AppRow = typeof jobApplication.$inferSelect & { tags: string[] };

export class DrizzleApplicationRepository implements IApplicationRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  private async attachTags(rows: (typeof jobApplication.$inferSelect)[]): Promise<AppRow[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const tagRows = await this.db
      .select()
      .from(applicationTag)
      .where(inArray(applicationTag.applicationId, ids));
    const byApp = new Map<string, string[]>();
    for (const t of tagRows) {
      const list = byApp.get(t.applicationId) ?? [];
      list.push(t.name);
      byApp.set(t.applicationId, list);
    }
    return rows.map((r) => ({ ...r, tags: byApp.get(r.id) ?? [] }));
  }

  async findAllByUserId(
    userId: string,
    filters?: { status?: ApplicationStatus },
  ): Promise<Application[]> {
    const conditions = [eq(jobApplication.userId, userId)];
    if (filters?.status) conditions.push(eq(jobApplication.status, filters.status));

    const rows = await this.db
      .select()
      .from(jobApplication)
      .where(and(...conditions))
      .orderBy(desc(jobApplication.createdAt), desc(jobApplication.id));
    const withTags = await this.attachTags(rows);
    return withTags.map((r) => this.toEntity(r));
  }

  async findPageByUserId(
    userId: string,
    filters: FindApplicationsPageFilters,
    pagination: FindApplicationsPagePagination,
  ): Promise<ApplicationsPage> {
    const search = filters.search?.trim();
    const { limit, cursor } = pagination;

    const conditions = [eq(jobApplication.userId, userId)];
    if (filters.status) conditions.push(eq(jobApplication.status, filters.status));
    if (filters.starred) conditions.push(eq(jobApplication.starred, true));
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

    if (cursor) {
      const [cursorRow] = await this.db
        .select({ createdAt: jobApplication.createdAt, id: jobApplication.id })
        .from(jobApplication)
        .where(eq(jobApplication.id, cursor))
        .limit(1);
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
      }
    }

    const rows = await this.db
      .select()
      .from(jobApplication)
      .where(and(...conditions))
      .orderBy(desc(jobApplication.createdAt), desc(jobApplication.id))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    const withTags = await this.attachTags(items);
    return { items: withTags.map((r) => this.toEntity(r)), hasNextPage };
  }

  async findById(id: string): Promise<Application | null> {
    const [row] = await this.db
      .select()
      .from(jobApplication)
      .where(eq(jobApplication.id, id))
      .limit(1);
    if (!row) return null;
    const [withTags] = await this.attachTags([row]);
    return this.toEntity(withTags);
  }

  async create(data: CreateApplicationData): Promise<Application> {
    const tags = data.tags ?? [];

    const exec = async (client: DrizzleClient): Promise<AppRow> => {
      const [app] = await client
        .insert(jobApplication)
        .values({
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
        })
        .returning();
      if (tags.length > 0) {
        await client
          .insert(applicationTag)
          .values(tags.map((name) => ({ id: nanoid(), applicationId: app.id, name })));
      }
      return { ...app, tags };
    };

    const ambient = txStorage.getStore();
    const row = ambient ? await exec(ambient) : await this.database.transaction(exec);
    return this.toEntity(row);
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
      const tags = data.tags;
      const exec = async (client: DrizzleClient): Promise<AppRow> => {
        // .set() throws "No values to set" given a literal {} (a tags-only
        // update has no scalar fields) — updatedAt is always safe to include
        // explicitly since every update should bump it anyway.
        const [app] = await client
          .update(jobApplication)
          .set({ ...scalarData, updatedAt: new Date() })
          .where(eq(jobApplication.id, id))
          .returning();
        await client.delete(applicationTag).where(eq(applicationTag.applicationId, id));
        if (tags.length > 0) {
          await client
            .insert(applicationTag)
            .values(tags.map((name) => ({ id: nanoid(), applicationId: id, name })));
        }
        return { ...app, tags };
      };

      const ambient = txStorage.getStore();
      const row = ambient ? await exec(ambient) : await this.database.transaction(exec);
      return this.toEntity(row);
    }

    const [row] = await this.db
      .update(jobApplication)
      .set({ ...scalarData, updatedAt: new Date() })
      .where(eq(jobApplication.id, id))
      .returning();
    const [withTags] = await this.attachTags([row]);
    return this.toEntity(withTags);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(jobApplication).where(eq(jobApplication.id, id));
  }

  async findDueForReminder(): Promise<Application[]> {
    const now = new Date();
    const in24h = new Date(now.getTime() + REMINDER_WINDOW_MS.DUE_WITHIN);
    const resendThreshold = new Date(now.getTime() - REMINDER_WINDOW_MS.RESEND_AFTER);
    const rows = await this.db
      .select()
      .from(jobApplication)
      .where(
        and(
          gte(jobApplication.followUpAt, now),
          lte(jobApplication.followUpAt, in24h),
          or(
            isNull(jobApplication.reminderSentAt),
            lte(jobApplication.reminderSentAt, resendThreshold),
          ),
        ),
      );
    const withTags = await this.attachTags(rows);
    return withTags.map((r) => this.toEntity(r));
  }

  async updateReminderSentAt(id: string, sentAt: Date): Promise<void> {
    await this.db
      .update(jobApplication)
      .set({ reminderSentAt: sentAt })
      .where(eq(jobApplication.id, id));
  }

  private toEntity(row: AppRow): Application {
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
      tags: row.tags,
      reminderSentAt: row.reminderSentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
