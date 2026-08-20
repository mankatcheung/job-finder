import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { document, jobApplication } from '../schema.js';
import type { Document } from '#src/domain/document/Document.js';
import type {
  IDocumentRepository,
  CreateDocumentData,
} from '#src/use-cases/ports/IDocumentRepository.js';
import { getClient, txStorage } from '../transactionContext.js';
import { CONTENT_LIMITS, DEFAULTS } from '#src/constants.js';
import { QuotaExceededError } from '#src/use-cases/errors/DomainError.js';

export class DrizzleDocumentRepository implements IDocumentRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findAllByApplicationId(applicationId: string): Promise<Document[]> {
    const rows = await this.db
      .select()
      .from(document)
      .where(eq(document.applicationId, applicationId))
      .orderBy(desc(document.createdAt));
    return rows.map((r) => this.toEntity(r));
  }

  async countByApplicationId(applicationId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(document)
      .where(eq(document.applicationId, applicationId));
    return Number(row?.count ?? 0);
  }

  async findAllByUserId(userId: string): Promise<Document[]> {
    const rows = await this.db
      .select({ document })
      .from(document)
      .innerJoin(jobApplication, eq(document.applicationId, jobApplication.id))
      .where(eq(jobApplication.userId, userId))
      .orderBy(desc(document.createdAt));
    return rows.map((r) => this.toEntity(r.document));
  }

  async findById(id: string): Promise<Document | null> {
    const [row] = await this.db.select().from(document).where(eq(document.id, id)).limit(1);
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const exec = async (client: DrizzleClient): Promise<Document> => {
      const [reserved] = await client
        .update(jobApplication)
        .set({ documentCount: sql`${jobApplication.documentCount} + 1` })
        .where(
          and(
            eq(jobApplication.id, data.applicationId),
            lt(jobApplication.documentCount, CONTENT_LIMITS.DOCUMENTS_PER_APPLICATION),
          ),
        )
        .returning({ id: jobApplication.id });

      if (!reserved) {
        throw new QuotaExceededError(
          `This application already has the maximum of ${CONTENT_LIMITS.DOCUMENTS_PER_APPLICATION} documents`,
        );
      }

      const [row] = await client
        .insert(document)
        .values({
          id: data.id,
          applicationId: data.applicationId,
          name: data.name,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          storageKey: data.storageKey,
          documentType: data.documentType ?? DEFAULTS.DOCUMENT_TYPE,
          version: data.version ?? null,
          sourceDraftId: data.sourceDraftId ?? null,
        })
        .returning();
      return this.toEntity(row);
    };

    const ambient = txStorage.getStore();
    return ambient ? exec(ambient) : this.database.transaction(exec);
  }

  async delete(id: string): Promise<void> {
    const exec = async (client: DrizzleClient): Promise<void> => {
      const [deleted] = await client
        .delete(document)
        .where(eq(document.id, id))
        .returning({ applicationId: document.applicationId });
      if (!deleted) return;

      await client
        .update(jobApplication)
        .set({
          documentCount: sql`case when ${jobApplication.documentCount} > 0 then ${jobApplication.documentCount} - 1 else 0 end`,
        })
        .where(eq(jobApplication.id, deleted.applicationId));
    };

    const ambient = txStorage.getStore();
    if (ambient) await exec(ambient);
    else await this.database.transaction(exec);
  }

  private toEntity(row: typeof document.$inferSelect): Document {
    return {
      id: row.id,
      applicationId: row.applicationId,
      name: row.name,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      documentType: row.documentType,
      version: row.version,
      sourceDraftId: row.sourceDraftId ?? null,
      createdAt: row.createdAt,
    };
  }
}
