import type { PrismaClient } from '@prisma/client';
import type { Note } from '#src/domain/note/Note.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import { getClient } from '../transactionContext.js';

export class PrismaNoteRepository implements INoteRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async findAllByApplicationId(applicationId: string): Promise<Note[]> {
    const rows = await this.db.note.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<Note | null> {
    const row = await this.db.note.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(data: { id: string; applicationId: string; content: string }): Promise<Note> {
    const row = await this.db.note.create({ data });
    return this.toEntity(row);
  }

  async update(id: string, content: string): Promise<Note> {
    const row = await this.db.note.update({ where: { id }, data: { content } });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.note.delete({ where: { id } });
  }

  private toEntity(row: {
    id: string;
    applicationId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }): Note {
    return {
      id: row.id,
      applicationId: row.applicationId,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
