import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleCookieConsentRepository } from '#src/infrastructure/db/repositories/DrizzleCookieConsentRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { cookieConsent } from '#src/infrastructure/db/schema.js';

describe('DrizzleCookieConsentRepository', () => {
  let db: TestDb;
  let repo: DrizzleCookieConsentRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleCookieConsentRepository({ db: db.db });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(cookieConsent);
  });

  describe('create', () => {
    it('persists a consent decision and returns the entity', async () => {
      const record = await repo.create({
        id: 'consent-1',
        analyticsAccepted: true,
        ipAddress: '203.0.113.5',
        userAgent: 'Mozilla/5.0',
      });

      expect(record.id).toBe('consent-1');
      expect(record.analyticsAccepted).toBe(true);
      expect(record.ipAddress).toBe('203.0.113.5');
      expect(record.userAgent).toBe('Mozilla/5.0');
      expect(record.consentedAt).toBeInstanceOf(Date);
    });

    it('persists a rejection and null ipAddress/userAgent', async () => {
      const record = await repo.create({
        id: 'consent-2',
        analyticsAccepted: false,
        ipAddress: null,
        userAgent: null,
      });

      expect(record.analyticsAccepted).toBe(false);
      expect(record.ipAddress).toBeNull();
      expect(record.userAgent).toBeNull();
    });
  });
});
