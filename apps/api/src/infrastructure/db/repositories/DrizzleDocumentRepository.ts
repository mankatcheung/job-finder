import { eq, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { document, jobApplication } from '../schema.js';
import type { Document } from '#src/domain/document/Document.js';
import type {
  IDocumentRepository,
  CreateDocumentData,
} from '#src/use-cases/ports/IDocumentRepository.js';
import { getClient } from '../transactionContext.js';
import { DEFAULTS } from '#src/constants.js';

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
    const [row] = await this.db
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
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(document).where(eq(document.id, id));
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
