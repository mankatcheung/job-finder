import type { PrismaClient } from '#src/generated/prisma/client.js';
import type { Contact } from '#src/domain/contact/Contact.js';
import type {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from '#src/use-cases/ports/IContactRepository.js';
import { getClient } from '../transactionContext.js';

export class PrismaContactRepository implements IContactRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async findAllByApplicationId(applicationId: string): Promise<Contact[]> {
    const rows = await this.db.contact.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<Contact | null> {
    const row = await this.db.contact.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateContactData): Promise<Contact> {
    const row = await this.db.contact.create({ data });
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const row = await this.db.contact.update({ where: { id }, data });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.contact.delete({ where: { id } });
  }

  private toEntity(row: {
    id: string;
    applicationId: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Contact {
    return {
      id: row.id,
      applicationId: row.applicationId,
      name: row.name,
      role: row.role,
      email: row.email,
      phone: row.phone,
      linkedinUrl: row.linkedinUrl,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
