import type { DrizzleDb, DrizzleClient } from '../client.js';
import { cookieConsent } from '../schema.js';
import type { CookieConsent } from '#src/domain/cookieConsent/CookieConsent.js';
import type {
  ICookieConsentRepository,
  CreateCookieConsentData,
} from '#src/use-cases/ports/ICookieConsentRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleCookieConsentRepository implements ICookieConsentRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateCookieConsentData): Promise<CookieConsent> {
    const [row] = await this.db.insert(cookieConsent).values(data).returning();
    return this.toEntity(row);
  }

  private toEntity(row: typeof cookieConsent.$inferSelect): CookieConsent {
    return {
      id: row.id,
      analyticsAccepted: row.analyticsAccepted,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      consentedAt: row.consentedAt,
    };
  }
}
