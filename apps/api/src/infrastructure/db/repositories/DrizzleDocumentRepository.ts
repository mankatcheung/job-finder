import { eq, desc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { Document } from '#src/domain/document/Document.js';
import type {
  IDocumentRepository,
  CreateDocumentData,
} from '#src/use-cases/ports/IDocumentRepository.js';
import { document as documentTable } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';
import { DEFAULTS } from '#src/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleDocumentRepository implements IDocumentRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findAllByApplicationId(applicationId: string): Promise<Document[]> {
    const rows = await this.database
      .select()
      .from(documentTable)
      .where(eq(documentTable.applicationId, applicationId))
      .orderBy(desc(documentTable.createdAt));
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<Document | null> {
    const [row] = await this.database.select().from(documentTable).where(eq(documentTable.id, id));
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const now = new Date();
    const row = {
      id: data.id,
      applicationId: data.applicationId,
      name: data.name,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      storageKey: data.storageKey,
      documentType: data.documentType ?? DEFAULTS.DOCUMENT_TYPE,
      version: data.version ?? null,
      createdAt: now,
    };
    await this.database.insert(documentTable).values(row);
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(documentTable).where(eq(documentTable.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): Document {
    return {
      id: row.id,
      applicationId: row.applicationId,
      name: row.name,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      documentType: row.documentType,
      version: row.version ?? null,
      createdAt: row.createdAt,
    };
  }
}
