import { vi } from 'vitest';
import type { ITransactionManager } from '@/use-cases/ports/ITransactionManager.js';
import type { IApiTokenRepository } from '@/use-cases/ports/IApiTokenRepository.js';
import type { ApiToken } from '@/domain/apiToken/ApiToken.js';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '@/use-cases/ports/IDocumentRepository.js';
import type { INoteRepository } from '@/use-cases/ports/INoteRepository.js';
import type { IInterviewRoundRepository } from '@/use-cases/ports/IInterviewRoundRepository.js';
import type { IActivityLogRepository } from '@/use-cases/ports/IActivityLogRepository.js';
import type { IContactRepository } from '@/use-cases/ports/IContactRepository.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import type { ILoginEventRepository } from '@/use-cases/ports/ILoginEventRepository.js';
import type { ISessionRepository } from '@/use-cases/ports/ISessionRepository.js';
import type { Session } from '@/domain/session/Session.js';
import type { IEmailVerificationTokenRepository } from '@/use-cases/ports/IEmailVerificationTokenRepository.js';
import type { EmailVerificationToken } from '@/domain/emailVerificationToken/EmailVerificationToken.js';
import type { User } from '@/domain/user/User.js';
import type { Application } from '@/domain/application/Application.js';
import type { Document } from '@/domain/document/Document.js';
import type { Note } from '@/domain/note/Note.js';
import type { InterviewRound } from '@/domain/interviewRound/InterviewRound.js';
import type { Contact } from '@/domain/contact/Contact.js';
import type { LoginEvent } from '@/domain/loginEvent/LoginEvent.js';
import type { ITotpBackupCodeRepository } from '@/use-cases/ports/ITotpBackupCodeRepository.js';
import type { TotpBackupCode } from '@/domain/totpBackupCode/TotpBackupCode.js';
import type { IRateLimiter } from '@/use-cases/ports/IRateLimiter.js';

export const makeUserRepository = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeApplicationRepository = (
  overrides?: Partial<IApplicationRepository>,
): IApplicationRepository => ({
  findAllByUserId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findDueForReminder: vi.fn().mockResolvedValue([]),
  updateReminderSentAt: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makeDocumentRepository = (
  overrides?: Partial<IDocumentRepository>,
): IDocumentRepository => ({
  findAllByApplicationId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeNoteRepository = (overrides?: Partial<INoteRepository>): INoteRepository => ({
  findAllByApplicationId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeInterviewRoundRepository = (
  overrides?: Partial<IInterviewRoundRepository>,
): IInterviewRoundRepository => ({
  findAllByApplicationId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeActivityLogRepository = (
  overrides?: Partial<IActivityLogRepository>,
): IActivityLogRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  append: vi.fn(),
  ...overrides,
});

export const makeLoginEventRepository = (
  overrides?: Partial<ILoginEventRepository>,
): ILoginEventRepository => ({
  create: vi.fn(),
  findRecentByUserId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

export const makeStorageProvider = (overrides?: Partial<IStorageProvider>): IStorageProvider => ({
  getPresignedUploadUrl: vi.fn(),
  getSignedUrl: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeApiTokenRepository = (
  overrides?: Partial<IApiTokenRepository>,
): IApiTokenRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findByTokenHash: vi.fn().mockResolvedValue(null),
  findByIdAndUserId: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  updateLastUsed: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeApiToken = (overrides?: Partial<ApiToken>): ApiToken => ({
  id: 'token-1',
  userId: 'user-1',
  name: 'My CLI token',
  tokenHash: 'hashed-value',
  scope: 'full',
  lastUsedAt: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeSessionRepository = (
  overrides?: Partial<ISessionRepository>,
): ISessionRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(null),
  findByIdAndUserId: vi.fn().mockResolvedValue(null),
  findActiveByUserId: vi.fn().mockResolvedValue([]),
  touch: vi.fn().mockResolvedValue(undefined),
  revoke: vi.fn().mockResolvedValue(undefined),
  revokeAllForUserExcept: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makeSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-1',
  userId: 'user-1',
  userAgent: 'Mozilla/5.0 (test)',
  ipAddress: '127.0.0.1',
  lastUsedAt: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  expiresAt: new Date('2024-01-08T00:00:00.000Z'),
  revokedAt: null,
  ...overrides,
});

export const makeEmailVerificationTokenRepository = (
  overrides?: Partial<IEmailVerificationTokenRepository>,
): IEmailVerificationTokenRepository => ({
  create: vi.fn(),
  findByTokenHash: vi.fn().mockResolvedValue(null),
  markUsed: vi.fn().mockResolvedValue(undefined),
  deleteAllForUser: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makeEmailVerificationToken = (
  overrides?: Partial<EmailVerificationToken>,
): EmailVerificationToken => ({
  id: 'verify-token-1',
  userId: 'user-1',
  tokenHash: 'hashed-verify-token',
  expiresAt: new Date('2024-01-02T00:00:00.000Z'),
  usedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const makeTotpBackupCodeRepository = (
  overrides?: Partial<ITotpBackupCodeRepository>,
): ITotpBackupCodeRepository => ({
  create: vi.fn(),
  findByCodeHash: vi.fn().mockResolvedValue(null),
  markUsed: vi.fn().mockResolvedValue(undefined),
  deleteAllForUser: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makeTotpBackupCode = (overrides?: Partial<TotpBackupCode>): TotpBackupCode => ({
  id: 'backup-code-1',
  userId: 'user-1',
  codeHash: 'hashed-backup-code',
  usedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const makeRateLimiter = (overrides?: Partial<IRateLimiter>): IRateLimiter => ({
  consume: vi.fn().mockReturnValue(true),
  ...overrides,
});

// Minimal FastifyInstance stub for AuthResolver (only jwt is used)
export const makeFastifyJwt = (): {
  jwt: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
} => ({
  jwt: {
    sign: vi.fn().mockReturnValue('signed-token'),
    verify: vi.fn(),
  },
});

export const makeLoginEvent = (overrides?: Partial<LoginEvent>): LoginEvent => ({
  id: 'event-1',
  userId: 'user-1',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

// Domain object fixtures
export const makeUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-pw',
  name: null,
  timezone: null,
  targetRole: null,
  emailVerifiedAt: null,
  weeklyDigestEnabled: true,
  followUpRemindersEnabled: true,
  totpSecret: null,
  totpEnabled: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeApplication = (overrides?: Partial<Application>): Application => ({
  id: 'app-1',
  userId: 'user-1',
  company: 'Acme Corp',
  role: 'Software Engineer',
  status: 'draft',
  jobUrl: null,
  location: null,
  salaryRange: null,
  description: null,
  appliedAt: null,
  starred: false,
  source: null,
  followUpAt: null,
  tags: [],
  reminderSentAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeNote = (overrides?: Partial<Note>): Note => ({
  id: 'note-1',
  applicationId: 'app-1',
  content: 'Interviewed well, follow up next week.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeInterviewRound = (overrides?: Partial<InterviewRound>): InterviewRound => ({
  id: 'round-1',
  applicationId: 'app-1',
  type: 'phone',
  scheduledAt: null,
  completedAt: null,
  interviewerName: null,
  notes: null,
  outcome: 'pending',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeContactRepository = (
  overrides?: Partial<IContactRepository>,
): IContactRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeContact = (overrides?: Partial<Contact>): Contact => ({
  id: 'contact-1',
  applicationId: 'app-1',
  name: 'Jane Recruiter',
  role: 'Technical Recruiter',
  email: 'jane@example.com',
  phone: null,
  linkedinUrl: null,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeTransactionManager = (
  overrides?: Partial<ITransactionManager>,
): ITransactionManager => ({
  run: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  ...overrides,
});

export const makeDocument = (overrides?: Partial<Document>): Document => ({
  id: 'doc-1',
  applicationId: 'app-1',
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 12345,
  storageKey: 'users/user-1/applications/app-1/resume.pdf',
  documentType: 'other',
  version: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});
