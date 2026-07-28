import { eq, asc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { Contact } from '#src/domain/contact/Contact.js';
import type {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from '#src/use-cases/ports/IContactRepository.js';
import { contact } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleContactRepository implements IContactRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findAllByApplicationId(applicationId: string): Promise<Contact[]> {
    const rows = await this.database
      .select()
      .from(contact)
      .where(eq(contact.applicationId, applicationId))
      .orderBy(asc(contact.createdAt));
    return rows.map(this.toEntity);
  }

  async findById(id: string): Promise<Contact | null> {
    const [row] = await this.database.select().from(contact).where(eq(contact.id, id));
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateContactData): Promise<Contact> {
    const now = new Date();
    const row = {
      id: data.id,
      applicationId: data.applicationId,
      name: data.name,
      role: data.role ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.insert(contact).values(row);
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await this.database.update(contact).set(updateData).where(eq(contact.id, id));
    const [row] = await this.database.select().from(contact).where(eq(contact.id, id));
    return this.toEntity(row!);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(contact).where(eq(contact.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): Contact {
    return {
      id: row.id,
      applicationId: row.applicationId,
      name: row.name,
      role: row.role ?? null,
      email: row.email ?? null,
      phone: row.phone ?? null,
      linkedinUrl: row.linkedinUrl ?? null,
      notes: row.notes ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
