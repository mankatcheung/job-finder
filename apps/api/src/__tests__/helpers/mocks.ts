import { vi } from 'vitest';
import type { ITransactionManager } from '#src/use-cases/ports/ITransactionManager.js';
import type { IApiTokenRepository } from '#src/use-cases/ports/IApiTokenRepository.js';
import type { ApiToken } from '#src/domain/apiToken/ApiToken.js';
import type { IShareLinkRepository } from '#src/use-cases/ports/IShareLinkRepository.js';
import type { ShareLink } from '#src/domain/shareLink/ShareLink.js';
import type { INotificationRepository } from '#src/use-cases/ports/INotificationRepository.js';
import type { Notification } from '#src/domain/notification/Notification.js';
import type { ICreateNotificationUseCase } from '#src/use-cases/notifications/ICreateNotificationUseCase.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '#src/use-cases/ports/IDocumentRepository.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';
import type { IOfferRepository } from '#src/use-cases/ports/IOfferRepository.js';
import type { Offer } from '#src/domain/offer/Offer.js';
import type { IContactRepository } from '#src/use-cases/ports/IContactRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type { IPasswordResetTokenRepository } from '#src/use-cases/ports/IPasswordResetTokenRepository.js';
import type { PasswordResetToken } from '#src/domain/passwordResetToken/PasswordResetToken.js';
import type { ILoginEventRepository } from '#src/use-cases/ports/ILoginEventRepository.js';
import type { ISecurityEventRepository } from '#src/use-cases/ports/ISecurityEventRepository.js';
import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { ISessionRepository } from '#src/use-cases/ports/ISessionRepository.js';
import type { Session } from '#src/domain/session/Session.js';
import type { IEmailVerificationTokenRepository } from '#src/use-cases/ports/IEmailVerificationTokenRepository.js';
import type { EmailVerificationToken } from '#src/domain/emailVerificationToken/EmailVerificationToken.js';
import type { User } from '#src/domain/user/User.js';
import type { Application } from '#src/domain/application/Application.js';
import type { Document } from '#src/domain/document/Document.js';
import type { Note } from '#src/domain/note/Note.js';
import type { InterviewRound } from '#src/domain/interviewRound/InterviewRound.js';
import type { Contact } from '#src/domain/contact/Contact.js';
import type { LoginEvent } from '#src/domain/loginEvent/LoginEvent.js';
import type { SecurityEvent } from '#src/domain/securityEvent/SecurityEvent.js';
import type { Message } from '#src/domain/message/Message.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type { ITotpBackupCodeRepository } from '#src/use-cases/ports/ITotpBackupCodeRepository.js';
import type { TotpBackupCode } from '#src/domain/totpBackupCode/TotpBackupCode.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { ITotpProvider } from '#src/use-cases/ports/ITotpProvider.js';
import { TotpProvider } from '#src/infrastructure/auth/TotpProvider.js';
import type { IOAuthAccountRepository } from '#src/use-cases/ports/IOAuthAccountRepository.js';
import type { IOAuthProvider } from '#src/use-cases/ports/IOAuthProvider.js';
import type { IOAuthProviderRegistry } from '#src/use-cases/ports/IOAuthProviderRegistry.js';
import type { OAuthAccount } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { ILlmApiKeyCipher } from '#src/use-cases/ports/ILlmApiKeyCipher.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { LlmApiKey } from '#src/domain/llmApiKey/LlmApiKey.js';
import type { IDocumentTextExtractor } from '#src/use-cases/ports/IDocumentTextExtractor.js';
import type { ILogger } from '#src/use-cases/ports/ILogger.js';
import type { IPushSubscriptionRepository } from '#src/use-cases/ports/IPushSubscriptionRepository.js';
import type { PushSubscription } from '#src/domain/pushSubscription/PushSubscription.js';
import type { ICompanyBriefingRepository } from '#src/use-cases/ports/ICompanyBriefingRepository.js';
import type { IDocumentDraftRepository } from '#src/use-cases/ports/IDocumentDraftRepository.js';
import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';
import type { IPdfRenderer } from '#src/use-cases/ports/IPdfRenderer.js';

export const makeUserRepository = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByBackupEmail: vi.fn(),
  findAll: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateLastDigestSentAt: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makeApplicationRepository = (
  overrides?: Partial<IApplicationRepository>,
): IApplicationRepository => ({
  findAllByUserId: vi.fn(),
  findPageByUserId: vi.fn().mockResolvedValue({ items: [], hasNextPage: false }),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  reorderBoard: vi.fn().mockResolvedValue([]),
  findDueForReminder: vi.fn().mockResolvedValue([]),
  updateReminderSentAt: vi.fn().mockResolvedValue(undefined),
  findByIdIncludingTrashed: vi.fn(),
  findTrashedByUserId: vi.fn().mockResolvedValue([]),
  findDueForPurge: vi.fn().mockResolvedValue([]),
  softDelete: vi.fn().mockResolvedValue(undefined),
  restore: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makeDocumentRepository = (
  overrides?: Partial<IDocumentRepository>,
): IDocumentRepository => ({
  findAllByApplicationId: vi.fn(),
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findAllByUserId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeNoteRepository = (overrides?: Partial<INoteRepository>): INoteRepository => ({
  // Defaults to an empty list, like the other list finders — a bare vi.fn()
  // resolves undefined, which every caller then has to guard against.
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  countByApplicationId: vi.fn().mockResolvedValue(0),
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
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findUpcomingWithinWindow: vi.fn().mockResolvedValue([]),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updatePushNotificationSentAt: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  ...overrides,
});

export const makeActivityLogRepository = (
  overrides?: Partial<IActivityLogRepository>,
): IActivityLogRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  findAllByUserId: vi.fn().mockResolvedValue([]),
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

export const makeSecurityEventRepository = (
  overrides?: Partial<ISecurityEventRepository>,
): ISecurityEventRepository => ({
  create: vi.fn(),
  findRecentByUserId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

export const makeMessageRepository = (
  overrides?: Partial<IMessageRepository>,
): IMessageRepository => ({
  create: vi.fn(),
  findAllByConversationId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

export const makeConversationRepository = (
  overrides?: Partial<IConversationRepository>,
): IConversationRepository => ({
  create: vi.fn(),
  findById: vi.fn().mockResolvedValue(null),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  updateTitle: vi.fn(),
  updateLlmSettings: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeStorageProvider = (overrides?: Partial<IStorageProvider>): IStorageProvider => ({
  getPresignedUploadUrl: vi.fn(),
  getSignedUrl: vi.fn(),
  putObject: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  ...overrides,
});

export const makeApiTokenRepository = (
  overrides?: Partial<IApiTokenRepository>,
): IApiTokenRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  findByTokenHash: vi.fn().mockResolvedValue(null),
  findByIdAndUserId: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  updateLastUsed: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeNotificationRepository = (
  overrides?: Partial<INotificationRepository>,
): INotificationRepository => ({
  create: vi.fn(),
  findPageByUserId: vi.fn().mockResolvedValue({ items: [], hasNextPage: false }),
  markManyReadForUser: vi.fn().mockResolvedValue(0),
  countUnreadForUser: vi.fn().mockResolvedValue(0),
  ...overrides,
});

export const makeCreateNotificationUseCase = (
  overrides?: Partial<ICreateNotificationUseCase>,
): ICreateNotificationUseCase => ({
  execute: vi.fn().mockImplementation((input) => Promise.resolve(makeNotification(input))),
  ...overrides,
});

export const makeNotification = (overrides?: Partial<Notification>): Notification => ({
  id: 'notification-1',
  userId: 'user-1',
  type: 'interview_reminder',
  title: 'Upcoming interview: Acme Corp',
  body: 'Software Engineer — phone interview tomorrow at 10:00 AM',
  url: '/applications/app-1',
  readAt: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeShareLinkRepository = (
  overrides?: Partial<IShareLinkRepository>,
): IShareLinkRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findByTokenHash: vi.fn().mockResolvedValue(null),
  findByIdAndUserId: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  updateLastUsed: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeShareLink = (overrides?: Partial<ShareLink>): ShareLink => ({
  id: 'share-link-1',
  userId: 'user-1',
  name: 'For my mentor',
  tokenHash: 'hashed-value',
  lastUsedAt: null,
  createdAt: new Date('2024-01-01'),
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

export const makePasswordResetTokenRepository = (
  overrides?: Partial<IPasswordResetTokenRepository>,
): IPasswordResetTokenRepository => ({
  create: vi.fn(),
  findByTokenHash: vi.fn().mockResolvedValue(null),
  markUsed: vi.fn().mockResolvedValue(undefined),
  deleteAllForUser: vi.fn().mockResolvedValue(undefined),
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
  rotateRefreshToken: vi.fn().mockResolvedValue(undefined),
  revoke: vi.fn().mockResolvedValue(undefined),
  revokeAllForUserExcept: vi.fn().mockResolvedValue(undefined),
  revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  findDistinctUserAgentsByUserId: vi.fn().mockResolvedValue([]),
  ...overrides,
});

export const makeSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-1',
  userId: 'user-1',
  userAgent: 'Mozilla/5.0 (test)',
  ipAddress: '127.0.0.1',
  deviceLabel: null,
  location: null,
  lastUsedAt: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  expiresAt: new Date('2024-01-08T00:00:00.000Z'),
  revokedAt: null,
  currentRefreshTokenId: 'refresh-token-id-1',
  previousRefreshTokenId: null,
  previousRotatedAt: null,
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

export const makePasswordResetToken = (
  overrides?: Partial<PasswordResetToken>,
): PasswordResetToken => ({
  id: 'reset-token-1',
  userId: 'user-1',
  tokenHash: 'hashed-reset-token',
  expiresAt: new Date('2024-01-01T01:00:00.000Z'),
  usedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const makeEmailVerificationToken = (
  overrides?: Partial<EmailVerificationToken>,
): EmailVerificationToken => ({
  id: 'verify-token-1',
  userId: 'user-1',
  tokenHash: 'hashed-verify-token',
  newEmail: null,
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
  consume: vi.fn().mockResolvedValue(true),
  ...overrides,
});

// generateSecret/getOtpauthUrl/verifyCode delegate to the real TOTP algorithm so
// tests can generate and verify genuinely valid codes; encryptSecret/decryptSecret
// use a simple reversible scheme so tests don't need TOTP_ENCRYPTION_KEY configured.
export const makeTotpProvider = (overrides?: Partial<ITotpProvider>): ITotpProvider => {
  const real = new TotpProvider();
  return {
    generateSecret: () => real.generateSecret(),
    getOtpauthUrl: (secret, label) => real.getOtpauthUrl(secret, label),
    verifyCode: (secret, code) => real.verifyCode(secret, code),
    encryptSecret: (secret) => `encrypted:${secret}`,
    decryptSecret: (secret) => secret.replace(/^encrypted:/, ''),
    ...overrides,
  };
};

export const makeLoginEvent = (overrides?: Partial<LoginEvent>): LoginEvent => ({
  id: 'event-1',
  userId: 'user-1',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeSecurityEvent = (overrides?: Partial<SecurityEvent>): SecurityEvent => ({
  id: 'sec-event-1',
  userId: 'user-1',
  eventType: 'password_changed',
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeMessage = (overrides?: Partial<Message>): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  role: 'user',
  content: 'hi',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeConversation = (overrides?: Partial<Conversation>): Conversation => ({
  id: 'conv-1',
  userId: 'user-1',
  title: null,
  llmProvider: null,
  llmModel: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
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
  avatarKey: null,
  weeklyDigestEnabled: true,
  digestFrequency: 'weekly',
  lastDigestSentAt: null,
  followUpRemindersEnabled: true,
  pushNotificationsEnabled: false,
  weeklyApplicationGoal: 5,
  totpSecret: null,
  totpEnabled: false,
  defaultLlmProvider: null,
  customAiPrompt: null,
  backupEmail: null,
  backupEmailVerifiedAt: null,
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
  deletedAt: null,
  followUpAt: null,
  tags: [],
  reminderSentAt: null,
  boardPosition: 0,
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
  pushNotificationSentAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeContactRepository = (
  overrides?: Partial<IContactRepository>,
): IContactRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  countByApplicationId: vi.fn().mockResolvedValue(0),
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
  sourceDraftId: null,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeCompanyBriefingRepository = (
  overrides?: Partial<ICompanyBriefingRepository>,
): ICompanyBriefingRepository => ({
  findByApplicationId: vi.fn().mockResolvedValue(null),
  upsert: vi.fn().mockImplementation((data) => Promise.resolve({ ...data })),
  ...overrides,
});

export const makeDocumentDraftRepository = (
  overrides?: Partial<IDocumentDraftRepository>,
): IDocumentDraftRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findById: vi.fn(),
  create: vi.fn(),
  updateContent: vi.fn(),
  rename: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeDocumentDraft = (overrides?: Partial<DocumentDraft>): DocumentDraft => ({
  id: 'draft-1',
  applicationId: 'app-1',
  type: 'cover_letter',
  title: 'Cover Letter',
  contentJson: '{"type":"doc","content":[]}',
  plainText: '',
  sourceDocumentId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makePdfRenderer = (overrides?: Partial<IPdfRenderer>): IPdfRenderer => ({
  render: vi.fn().mockResolvedValue(Buffer.from('pdf-content')),
  ...overrides,
});

export const makeOAuthAccountRepository = (
  overrides?: Partial<IOAuthAccountRepository>,
): IOAuthAccountRepository => ({
  findByProvider: vi.fn().mockResolvedValue(null),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makeOAuthAccount = (overrides?: Partial<OAuthAccount>): OAuthAccount => ({
  id: 'oauth-account-1',
  userId: 'user-1',
  provider: 'google',
  providerAccountId: 'google-sub-1',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeOAuthProvider = (overrides?: Partial<IOAuthProvider>): IOAuthProvider => ({
  getAuthorizationUrl: vi.fn().mockReturnValue('https://provider.example.com/authorize'),
  exchangeCodeForProfile: vi.fn().mockResolvedValue({
    providerAccountId: 'google-sub-1',
    email: 'test@example.com',
    emailVerified: true,
    name: 'Jeff Man',
  }),
  ...overrides,
});

export const makeOAuthProviderRegistry = (
  overrides?: Partial<IOAuthProviderRegistry>,
): IOAuthProviderRegistry => ({
  get: vi.fn().mockReturnValue(makeOAuthProvider()),
  ...overrides,
});

export const makeLLMProvider = (response = 'llm response'): ILLMProvider => ({
  complete: vi.fn().mockResolvedValue(response),
  completeWithTools: vi.fn().mockResolvedValue({ content: response, toolCalls: [] }),
});

export const makeLLMProviderFactory = (
  overrides?: Partial<ILLMProviderFactory>,
): ILLMProviderFactory => ({
  forUser: vi.fn().mockResolvedValue(makeLLMProvider()),
  ...overrides,
});

export const makeLlmApiKeyCipher = (overrides?: Partial<ILlmApiKeyCipher>): ILlmApiKeyCipher => ({
  encrypt: vi.fn((plaintext: string) => `encrypted:${plaintext}`),
  decrypt: vi.fn((ciphertext: string) => ciphertext.replace(/^encrypted:/, '')),
  ...overrides,
});

export const makeLlmApiKeyRepository = (
  overrides?: Partial<ILlmApiKeyRepository>,
): ILlmApiKeyRepository => ({
  upsert: vi.fn(),
  findByUserIdAndProvider: vi.fn().mockResolvedValue(null),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  delete: vi.fn(),
  ...overrides,
});

export const makeLlmApiKey = (overrides?: Partial<LlmApiKey>): LlmApiKey => ({
  id: 'llm-key-1',
  userId: 'user-1',
  provider: 'openai',
  apiKey: 'encrypted:sk-test',
  model: null,
  baseUrl: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeDocumentTextExtractor = (
  overrides?: Partial<IDocumentTextExtractor>,
): IDocumentTextExtractor => ({
  extract: vi.fn().mockResolvedValue('extracted resume text'),
  ...overrides,
});

export const makeLogger = (overrides?: Partial<ILogger>): ILogger => ({
  error: vi.fn(),
  ...overrides,
});

export const makePushSubscriptionRepository = (
  overrides?: Partial<IPushSubscriptionRepository>,
): IPushSubscriptionRepository => ({
  findByUserId: vi.fn().mockResolvedValue([]),
  findByEndpoint: vi.fn().mockResolvedValue(null),
  upsert: vi.fn(),
  deleteByEndpoint: vi.fn().mockResolvedValue(undefined),
  deleteByUserId: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const makePushSubscription = (overrides?: Partial<PushSubscription>): PushSubscription => ({
  id: 'push-sub-1',
  userId: 'user-1',
  endpoint: 'https://push.example.com/sub-1',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type { Education } from '#src/domain/education/Education.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';
import type { Skill } from '#src/domain/skill/Skill.js';

export const makeWorkExperienceRepository = (
  overrides?: Partial<IWorkExperienceRepository>,
): IWorkExperienceRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeEducationRepository = (
  overrides?: Partial<IEducationRepository>,
): IEducationRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeSkillRepository = (overrides?: Partial<ISkillRepository>): ISkillRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeWorkExperience = (overrides?: Partial<WorkExperience>): WorkExperience => ({
  id: 'we-1',
  userId: 'user-1',
  company: 'Acme Corp',
  title: 'Software Engineer',
  location: 'San Francisco, CA',
  startDate: new Date('2020-01-01'),
  endDate: new Date('2023-01-01'),
  description: 'Built scalable web applications.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeEducation = (overrides?: Partial<Education>): Education => ({
  id: 'edu-1',
  userId: 'user-1',
  institution: 'UC Berkeley',
  degree: 'B.S.',
  field: 'Computer Science',
  startDate: new Date('2016-09-01'),
  endDate: new Date('2020-05-15'),
  description: 'Graduated with honors.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeSkill = (overrides?: Partial<Skill>): Skill => ({
  id: 'skill-1',
  userId: 'user-1',
  name: 'TypeScript',
  category: 'Language',
  proficiency: 'expert',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeOfferRepository = (overrides?: Partial<IOfferRepository>): IOfferRepository => ({
  findAllByApplicationId: vi.fn().mockResolvedValue([]),
  countByApplicationId: vi.fn().mockResolvedValue(0),
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

export const makeOffer = (overrides?: Partial<Offer>): Offer => ({
  id: 'offer-1',
  applicationId: 'app-1',
  baseSalary: 120_000,
  bonus: null,
  equity: null,
  benefits: null,
  costOfLivingAdjustment: null,
  currency: 'USD',
  period: 'yearly',
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
