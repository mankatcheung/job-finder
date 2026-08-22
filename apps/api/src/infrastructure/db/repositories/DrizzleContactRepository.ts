import { eq, asc, sql } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { contact } from '../schema.js';
import type { Contact } from '#src/domain/contact/Contact.js';
import type {
  IContactRepository,
  CreateContactData,
  UpdateContactData,
} from '#src/use-cases/ports/IContactRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleContactRepository implements IContactRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async countByApplicationId(applicationId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(contact)
      .where(eq(contact.applicationId, applicationId));
    return Number(row?.count ?? 0);
  }

  async findAllByApplicationId(applicationId: string): Promise<Contact[]> {
    const rows = await this.db
      .select()
      .from(contact)
      .where(eq(contact.applicationId, applicationId))
      .orderBy(asc(contact.createdAt));
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<Contact | null> {
    const [row] = await this.db.select().from(contact).where(eq(contact.id, id)).limit(1);
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateContactData): Promise<Contact> {
    const [row] = await this.db.insert(contact).values(data).returning();
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    const [row] = await this.db
      .update(contact)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contact.id, id))
      .returning();
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(contact).where(eq(contact.id, id));
  }

  private toEntity(row: typeof contact.$inferSelect): Contact {
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
