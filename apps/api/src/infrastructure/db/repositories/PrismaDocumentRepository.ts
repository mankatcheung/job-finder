import type { PrismaClient } from '@prisma/client';
import type { Document } from '#src/domain/document/Document.js';
import type {
  IDocumentRepository,
  CreateDocumentData,
} from '#src/use-cases/ports/IDocumentRepository.js';
import { getClient } from '../transactionContext.js';
import { DEFAULTS } from '#src/constants.js';

export class PrismaDocumentRepository implements IDocumentRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async findAllByApplicationId(applicationId: string): Promise<Document[]> {
    const rows = await this.db.document.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<Document | null> {
    const row = await this.db.document.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const row = await this.db.document.create({
      data: {
        id: data.id,
        applicationId: data.applicationId,
        name: data.name,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey: data.storageKey,
        documentType: data.documentType ?? DEFAULTS.DOCUMENT_TYPE,
        version: data.version ?? null,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.document.delete({ where: { id } });
  }

  private toEntity(row: {
    id: string;
    applicationId: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    documentType: string;
    version: string | null;
    createdAt: Date;
  }): Document {
    return {
      id: row.id,
      applicationId: row.applicationId,
      name: row.name,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      documentType: row.documentType,
      version: row.version,
      createdAt: row.createdAt,
    };
  }
}
