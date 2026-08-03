import { nanoid } from 'nanoid';
import { asClass, asValue, createContainer, Lifetime, type AwilixContainer } from 'awilix';

import { db } from '#src/infrastructure/db/client.js';

import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { DrizzleUserRepository } from '#src/infrastructure/db/repositories/DrizzleUserRepository.js';
import { DrizzleApplicationRepository } from '#src/infrastructure/db/repositories/DrizzleApplicationRepository.js';
import { DrizzleNoteRepository } from '#src/infrastructure/db/repositories/DrizzleNoteRepository.js';
import { DrizzleDocumentRepository } from '#src/infrastructure/db/repositories/DrizzleDocumentRepository.js';
import { CachedApplicationRepository } from '#src/infrastructure/db/repositories/CachedApplicationRepository.js';
import { CachedNoteRepository } from '#src/infrastructure/db/repositories/CachedNoteRepository.js';
import { CachedDocumentRepository } from '#src/infrastructure/db/repositories/CachedDocumentRepository.js';
import { DrizzleInterviewRoundRepository } from '#src/infrastructure/db/repositories/DrizzleInterviewRoundRepository.js';
import { CachedInterviewRoundRepository } from '#src/infrastructure/db/repositories/CachedInterviewRoundRepository.js';
import { DrizzleActivityLogRepository } from '#src/infrastructure/db/repositories/DrizzleActivityLogRepository.js';
import { DrizzlePushSubscriptionRepository } from '#src/infrastructure/db/repositories/DrizzlePushSubscriptionRepository.js';
import { DrizzleContactRepository } from '#src/infrastructure/db/repositories/DrizzleContactRepository.js';
import { DrizzlePasswordResetTokenRepository } from '#src/infrastructure/db/repositories/DrizzlePasswordResetTokenRepository.js';
import { DrizzleLoginEventRepository } from '#src/infrastructure/db/repositories/DrizzleLoginEventRepository.js';
import { DrizzleSessionRepository } from '#src/infrastructure/db/repositories/DrizzleSessionRepository.js';
import { DrizzleMessageRepository } from '#src/infrastructure/db/repositories/DrizzleMessageRepository.js';
import { DrizzleConversationRepository } from '#src/infrastructure/db/repositories/DrizzleConversationRepository.js';
import { DrizzleEmailVerificationTokenRepository } from '#src/infrastructure/db/repositories/DrizzleEmailVerificationTokenRepository.js';
import { DrizzleTotpBackupCodeRepository } from '#src/infrastructure/db/repositories/DrizzleTotpBackupCodeRepository.js';
import { RateLimiter } from '#src/infrastructure/rateLimit/RateLimiter.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import { TotpProvider } from '#src/infrastructure/auth/TotpProvider.js';
import type { ITotpProvider } from '#src/use-cases/ports/ITotpProvider.js';
import { DrizzleOAuthAccountRepository } from '#src/infrastructure/db/repositories/DrizzleOAuthAccountRepository.js';
import { GoogleOAuthProvider } from '#src/infrastructure/auth/GoogleOAuthProvider.js';
import { GitHubOAuthProvider } from '#src/infrastructure/auth/GitHubOAuthProvider.js';
import { OAuthProviderRegistry } from '#src/infrastructure/auth/OAuthProviderRegistry.js';
import { OAuthStateService } from '#src/infrastructure/auth/OAuthStateService.js';
import type { IOAuthProvider } from '#src/use-cases/ports/IOAuthProvider.js';
import { LoginOrSignupWithOAuthUseCase } from '#src/use-cases/oauth/LoginOrSignupWithOAuthUseCase.js';
import { LinkOAuthAccountUseCase } from '#src/use-cases/oauth/LinkOAuthAccountUseCase.js';
import { UnlinkOAuthAccountUseCase } from '#src/use-cases/oauth/UnlinkOAuthAccountUseCase.js';
import { ListLinkedOAuthAccountsUseCase } from '#src/use-cases/oauth/ListLinkedOAuthAccountsUseCase.js';
import { OAuthAccountMapper } from '#src/interface-adapters/mappers/OAuthAccountMapper.js';
import { OAuthResolver } from '#src/interface-adapters/resolvers/OAuthResolver.js';

import { LocalStorageProvider } from '#src/infrastructure/storage/LocalStorageProvider.js';
import { VercelBlobStorageProvider } from '#src/infrastructure/storage/VercelBlobStorageProvider.js';

import { ApplicationMapper } from '#src/interface-adapters/mappers/ApplicationMapper.js';
import { NoteMapper } from '#src/interface-adapters/mappers/NoteMapper.js';
import { DocumentMapper } from '#src/interface-adapters/mappers/DocumentMapper.js';
import { UserMapper } from '#src/interface-adapters/mappers/UserMapper.js';
import { InterviewRoundMapper } from '#src/interface-adapters/mappers/InterviewRoundMapper.js';
import { ActivityLogMapper } from '#src/interface-adapters/mappers/ActivityLogMapper.js';
import { ContactMapper } from '#src/interface-adapters/mappers/ContactMapper.js';
import { LoginEventMapper } from '#src/interface-adapters/mappers/LoginEventMapper.js';
import { MessageMapper } from '#src/interface-adapters/mappers/MessageMapper.js';
import { ConversationMapper } from '#src/interface-adapters/mappers/ConversationMapper.js';
import { SessionMapper } from '#src/interface-adapters/mappers/SessionMapper.js';

import { AuthResolver } from '#src/interface-adapters/resolvers/AuthResolver.js';
import { ApplicationResolver } from '#src/interface-adapters/resolvers/ApplicationResolver.js';
import { NoteResolver } from '#src/interface-adapters/resolvers/NoteResolver.js';
import { DocumentResolver } from '#src/interface-adapters/resolvers/DocumentResolver.js';
import { UserResolver } from '#src/interface-adapters/resolvers/UserResolver.js';
import { InterviewRoundResolver } from '#src/interface-adapters/resolvers/InterviewRoundResolver.js';
import { ActivityLogResolver } from '#src/interface-adapters/resolvers/ActivityLogResolver.js';
import { ContactResolver } from '#src/interface-adapters/resolvers/ContactResolver.js';
import { LoginEventResolver } from '#src/interface-adapters/resolvers/LoginEventResolver.js';
import { ApiTokenResolver } from '#src/interface-adapters/resolvers/ApiTokenResolver.js';
import { NotificationResolver } from '#src/interface-adapters/resolvers/NotificationResolver.js';
import { SessionResolver } from '#src/interface-adapters/resolvers/SessionResolver.js';
import { McpController } from '#src/interface-adapters/mcp/McpController.js';

import { AuthenticateRequestUseCase } from '#src/use-cases/auth/AuthenticateRequestUseCase.js';
import { AuthenticateMcpRequestUseCase } from '#src/use-cases/auth/AuthenticateMcpRequestUseCase.js';
import { RegisterUseCase } from '#src/use-cases/auth/RegisterUseCase.js';
import { LoginUseCase } from '#src/use-cases/auth/LoginUseCase.js';
import { LoginWithTotpUseCase } from '#src/use-cases/auth/LoginWithTotpUseCase.js';
import { ReauthenticateUseCase } from '#src/use-cases/auth/ReauthenticateUseCase.js';
import { RequestPasswordResetUseCase } from '#src/use-cases/auth/RequestPasswordResetUseCase.js';
import { ResetPasswordUseCase } from '#src/use-cases/auth/ResetPasswordUseCase.js';
import { SendEmailVerificationUseCase } from '#src/use-cases/auth/SendEmailVerificationUseCase.js';
import { VerifyEmailUseCase } from '#src/use-cases/auth/VerifyEmailUseCase.js';
import { CreateApplicationUseCase } from '#src/use-cases/jobs/CreateApplicationUseCase.js';
import { GetApplicationsUseCase } from '#src/use-cases/jobs/GetApplicationsUseCase.js';
import { GetApplicationsPageUseCase } from '#src/use-cases/jobs/GetApplicationsPageUseCase.js';
import { GetApplicationUseCase } from '#src/use-cases/jobs/GetApplicationUseCase.js';
import { UpdateApplicationUseCase } from '#src/use-cases/jobs/UpdateApplicationUseCase.js';
import { DeleteApplicationUseCase } from '#src/use-cases/jobs/DeleteApplicationUseCase.js';
import { BulkUpdateApplicationsUseCase } from '#src/use-cases/jobs/BulkUpdateApplicationsUseCase.js';
import { BulkDeleteApplicationsUseCase } from '#src/use-cases/jobs/BulkDeleteApplicationsUseCase.js';
import { BulkAddTagToApplicationsUseCase } from '#src/use-cases/jobs/BulkAddTagToApplicationsUseCase.js';
import { CreateNoteUseCase } from '#src/use-cases/notes/CreateNoteUseCase.js';
import { GetNotesUseCase } from '#src/use-cases/notes/GetNotesUseCase.js';
import { UpdateNoteUseCase } from '#src/use-cases/notes/UpdateNoteUseCase.js';
import { DeleteNoteUseCase } from '#src/use-cases/notes/DeleteNoteUseCase.js';
import { RequestUploadUrlUseCase } from '#src/use-cases/documents/RequestUploadUrlUseCase.js';
import { ConfirmDocumentUseCase } from '#src/use-cases/documents/ConfirmDocumentUseCase.js';
import { GetDocumentsUseCase } from '#src/use-cases/documents/GetDocumentsUseCase.js';
import { DeleteDocumentUseCase } from '#src/use-cases/documents/DeleteDocumentUseCase.js';
import { RequestEmailChangeUseCase } from '#src/use-cases/user/RequestEmailChangeUseCase.js';
import { ConfirmEmailChangeUseCase } from '#src/use-cases/user/ConfirmEmailChangeUseCase.js';
import { UpdatePasswordUseCase } from '#src/use-cases/user/UpdatePasswordUseCase.js';
import { DeleteAccountUseCase } from '#src/use-cases/user/DeleteAccountUseCase.js';
import { ExportUserDataUseCase } from '#src/use-cases/user/ExportUserDataUseCase.js';
import { GenerateTotpSecretUseCase } from '#src/use-cases/user/GenerateTotpSecretUseCase.js';
import { ConfirmTotpSetupUseCase } from '#src/use-cases/user/ConfirmTotpSetupUseCase.js';
import { DisableTotpUseCase } from '#src/use-cases/user/DisableTotpUseCase.js';
import { GetTotpStatusUseCase } from '#src/use-cases/user/GetTotpStatusUseCase.js';
import { SaveLlmApiKeyUseCase } from '#src/use-cases/user/SaveLlmApiKeyUseCase.js';
import { ListLlmApiKeysUseCase } from '#src/use-cases/user/ListLlmApiKeysUseCase.js';
import { DeleteLlmApiKeyUseCase } from '#src/use-cases/user/DeleteLlmApiKeyUseCase.js';
import { SetDefaultLlmProviderUseCase } from '#src/use-cases/user/SetDefaultLlmProviderUseCase.js';
import { ImportUserDataUseCase } from '#src/use-cases/user/ImportUserDataUseCase.js';
import { GetNotificationPreferencesUseCase } from '#src/use-cases/user/GetNotificationPreferencesUseCase.js';
import { UpdateNotificationPreferencesUseCase } from '#src/use-cases/user/UpdateNotificationPreferencesUseCase.js';
import { UpdateProfileUseCase } from '#src/use-cases/user/UpdateProfileUseCase.js';
import { GetUserUseCase } from '#src/use-cases/user/GetUserUseCase.js';
import { RequestAvatarUploadUrlUseCase } from '#src/use-cases/user/RequestAvatarUploadUrlUseCase.js';
import { ConfirmAvatarUseCase } from '#src/use-cases/user/ConfirmAvatarUseCase.js';
import { RemoveAvatarUseCase } from '#src/use-cases/user/RemoveAvatarUseCase.js';
import { CreateInterviewRoundUseCase } from '#src/use-cases/interviewRounds/CreateInterviewRoundUseCase.js';
import { GetInterviewRoundsUseCase } from '#src/use-cases/interviewRounds/GetInterviewRoundsUseCase.js';
import { UpdateInterviewRoundUseCase } from '#src/use-cases/interviewRounds/UpdateInterviewRoundUseCase.js';
import { DeleteInterviewRoundUseCase } from '#src/use-cases/interviewRounds/DeleteInterviewRoundUseCase.js';
import { GetActivityLogsUseCase } from '#src/use-cases/activityLogs/GetActivityLogsUseCase.js';
import { GetLoginHistoryUseCase } from '#src/use-cases/loginEvents/GetLoginHistoryUseCase.js';
import { GetChatHistoryUseCase } from '#src/use-cases/chat/GetChatHistoryUseCase.js';
import { CreateConversationUseCase } from '#src/use-cases/conversations/CreateConversationUseCase.js';
import { ListConversationsUseCase } from '#src/use-cases/conversations/ListConversationsUseCase.js';
import { DeleteConversationUseCase } from '#src/use-cases/conversations/DeleteConversationUseCase.js';
import { JwtTokenService } from '#src/infrastructure/auth/JwtTokenService.js';
import { DrizzleApiTokenRepository } from '#src/infrastructure/db/repositories/DrizzleApiTokenRepository.js';
import { ApiTokenMapper } from '#src/interface-adapters/mappers/ApiTokenMapper.js';
import { CreateApiTokenUseCase } from '#src/use-cases/apiTokens/CreateApiTokenUseCase.js';
import { ListApiTokensUseCase } from '#src/use-cases/apiTokens/ListApiTokensUseCase.js';
import { DeleteApiTokenUseCase } from '#src/use-cases/apiTokens/DeleteApiTokenUseCase.js';
import { ValidateApiTokenUseCase } from '#src/use-cases/apiTokens/ValidateApiTokenUseCase.js';
import { DrizzleNotificationRepository } from '#src/infrastructure/db/repositories/DrizzleNotificationRepository.js';
import { NotificationMapper } from '#src/interface-adapters/mappers/NotificationMapper.js';
import { CreateNotificationUseCase } from '#src/use-cases/notifications/CreateNotificationUseCase.js';
import { GetNotificationsPageUseCase } from '#src/use-cases/notifications/GetNotificationsPageUseCase.js';
import { MarkNotificationsReadUseCase } from '#src/use-cases/notifications/MarkNotificationsReadUseCase.js';
import { GetUnreadNotificationCountUseCase } from '#src/use-cases/notifications/GetUnreadNotificationCountUseCase.js';
import { CreateContactUseCase } from '#src/use-cases/contacts/CreateContactUseCase.js';
import { GetContactsUseCase } from '#src/use-cases/contacts/GetContactsUseCase.js';
import { UpdateContactUseCase } from '#src/use-cases/contacts/UpdateContactUseCase.js';
import { DeleteContactUseCase } from '#src/use-cases/contacts/DeleteContactUseCase.js';
import { BrevoEmailService } from '#src/infrastructure/email/BrevoEmailService.js';
import { DeviceLabelService } from '#src/infrastructure/device/DeviceLabelService.js';
import { IpLocationService } from '#src/infrastructure/device/IpLocationService.js';
import type { IDeviceLabeler } from '#src/use-cases/ports/IDeviceLabeler.js';
import type { IIpLocationResolver } from '#src/use-cases/ports/IIpLocationResolver.js';
import { SendFollowUpRemindersUseCase } from '#src/use-cases/reminders/SendFollowUpRemindersUseCase.js';
import { RegisterPushSubscriptionUseCase } from '#src/use-cases/push/RegisterPushSubscriptionUseCase.js';
import { UnregisterPushSubscriptionUseCase } from '#src/use-cases/push/UnregisterPushSubscriptionUseCase.js';
import { SendPushNotificationsUseCase } from '#src/use-cases/push/SendPushNotificationsUseCase.js';
import { WebPushService } from '#src/infrastructure/push/WebPushService.js';
import { DrizzleTransactionManager } from '#src/infrastructure/db/DrizzleTransactionManager.js';
import { LlmApiKeyCipher } from '#src/infrastructure/llm/LlmApiKeyCipher.js';
import { UserLLMProviderFactory } from '#src/infrastructure/llm/UserLLMProviderFactory.js';
import { DrizzleLlmApiKeyRepository } from '#src/infrastructure/db/repositories/DrizzleLlmApiKeyRepository.js';
import { LlmApiKeyMapper } from '#src/interface-adapters/mappers/LlmApiKeyMapper.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import { ParseJobDescriptionUseCase } from '#src/use-cases/jobDescription/ParseJobDescriptionUseCase.js';
import { FetchJobPostingSourceResolver } from '#src/infrastructure/jobDescription/FetchJobPostingSourceResolver.js';
import type { IJobPostingSourceResolver } from '#src/use-cases/ports/IJobPostingSourceResolver.js';
import { GenerateCoverLetterUseCase } from '#src/use-cases/coverLetter/GenerateCoverLetterUseCase.js';
import { ComputeHealthScoreUseCase } from '#src/use-cases/application/ComputeHealthScoreUseCase.js';
import { ComputeResumeMatchScoreUseCase } from '#src/use-cases/application/ComputeResumeMatchScoreUseCase.js';
import { GetCalendarEventsUseCase } from '#src/use-cases/calendar/GetCalendarEventsUseCase.js';
import { SendWeeklyDigestUseCase } from '#src/use-cases/digest/SendWeeklyDigestUseCase.js';
import { CreateSessionUseCase } from '#src/use-cases/sessions/CreateSessionUseCase.js';
import { RotateRefreshTokenUseCase } from '#src/use-cases/sessions/RotateRefreshTokenUseCase.js';
import { ListSessionsUseCase } from '#src/use-cases/sessions/ListSessionsUseCase.js';
import { RevokeSessionUseCase } from '#src/use-cases/sessions/RevokeSessionUseCase.js';
import { RevokeOtherSessionsUseCase } from '#src/use-cases/sessions/RevokeOtherSessionsUseCase.js';
import { ChatWithAssistantUseCase } from '#src/use-cases/chat/ChatWithAssistantUseCase.js';
import { DocumentTextExtractor } from '#src/infrastructure/documents/DocumentTextExtractor.js';

import { ENV, RATE_LIMIT, STORAGE_PROVIDER } from '#src/constants.js';
import type { ILlmApiKeyCipher } from '#src/use-cases/ports/ILlmApiKeyCipher.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { IDocumentTextExtractor } from '#src/use-cases/ports/IDocumentTextExtractor.js';
import type { ILogger } from '#src/use-cases/ports/ILogger.js';

export interface Cradle {
  db: typeof db;
  storageProvider: LocalStorageProvider | VercelBlobStorageProvider;
  generateId: () => string;
  webAppOrigin: string;
  logger: ILogger;
  tokenService: JwtTokenService;
  cache: MemoryCache;
  passwordResetRateLimiter: RateLimiter;

  // Raw repositories (used internally by the cached decorators)
  userRepository: DrizzleUserRepository;
  prismaApplicationRepository: DrizzleApplicationRepository;
  prismaNoteRepository: DrizzleNoteRepository;
  prismaDocumentRepository: DrizzleDocumentRepository;

  // Cached repository decorators (what use-cases consume)
  applicationRepository: CachedApplicationRepository;
  noteRepository: CachedNoteRepository;
  documentRepository: CachedDocumentRepository;
  prismaInterviewRoundRepository: DrizzleInterviewRoundRepository;
  interviewRoundRepository: CachedInterviewRoundRepository;
  activityLogRepository: DrizzleActivityLogRepository;
  apiTokenRepository: DrizzleApiTokenRepository;
  notificationRepository: DrizzleNotificationRepository;
  contactRepository: DrizzleContactRepository;
  passwordResetTokenRepository: DrizzlePasswordResetTokenRepository;
  loginEventRepository: DrizzleLoginEventRepository;
  messageRepository: DrizzleMessageRepository;
  conversationRepository: DrizzleConversationRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
  sessionRepository: DrizzleSessionRepository;
  emailVerificationTokenRepository: DrizzleEmailVerificationTokenRepository;
  totpBackupCodeRepository: DrizzleTotpBackupCodeRepository;
  totpRateLimiter: IRateLimiter;
  chatRateLimiter: IRateLimiter;
  updatePasswordRateLimiter: IRateLimiter;
  requestEmailChangeRateLimiter: IRateLimiter;
  totpProvider: ITotpProvider;
  oauthAccountRepository: DrizzleOAuthAccountRepository;
  googleOAuthProvider: IOAuthProvider;
  gitHubOAuthProvider: IOAuthProvider;
  oauthProviderRegistry: OAuthProviderRegistry;
  oauthStateService: OAuthStateService;

  applicationMapper: ApplicationMapper;
  apiTokenMapper: ApiTokenMapper;
  notificationMapper: NotificationMapper;
  noteMapper: NoteMapper;
  documentMapper: DocumentMapper;
  userMapper: UserMapper;
  interviewRoundMapper: InterviewRoundMapper;
  activityLogMapper: ActivityLogMapper;
  contactMapper: ContactMapper;
  loginEventMapper: LoginEventMapper;
  messageMapper: MessageMapper;
  conversationMapper: ConversationMapper;
  llmApiKeyMapper: LlmApiKeyMapper;
  sessionMapper: SessionMapper;
  oauthAccountMapper: OAuthAccountMapper;

  authResolver: AuthResolver;
  applicationResolver: ApplicationResolver;
  noteResolver: NoteResolver;
  documentResolver: DocumentResolver;
  userResolver: UserResolver;
  interviewRoundResolver: InterviewRoundResolver;
  activityLogResolver: ActivityLogResolver;
  contactResolver: ContactResolver;
  loginEventResolver: LoginEventResolver;
  apiTokenResolver: ApiTokenResolver;
  notificationResolver: NotificationResolver;
  sessionResolver: SessionResolver;
  oauthResolver: OAuthResolver;
  mcpController: McpController;

  loginOrSignupWithOAuthUseCase: LoginOrSignupWithOAuthUseCase;
  linkOAuthAccountUseCase: LinkOAuthAccountUseCase;
  unlinkOAuthAccountUseCase: UnlinkOAuthAccountUseCase;
  listLinkedOAuthAccountsUseCase: ListLinkedOAuthAccountsUseCase;

  authenticateRequestUseCase: AuthenticateRequestUseCase;
  authenticateMcpRequestUseCase: AuthenticateMcpRequestUseCase;
  registerUseCase: RegisterUseCase;
  loginUseCase: LoginUseCase;
  loginWithTotpUseCase: LoginWithTotpUseCase;
  reauthenticateUseCase: ReauthenticateUseCase;
  requestPasswordResetUseCase: RequestPasswordResetUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;
  sendEmailVerificationUseCase: SendEmailVerificationUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  createApplicationUseCase: CreateApplicationUseCase;
  getApplicationsUseCase: GetApplicationsUseCase;
  getApplicationsPageUseCase: GetApplicationsPageUseCase;
  getApplicationUseCase: GetApplicationUseCase;
  updateApplicationUseCase: UpdateApplicationUseCase;
  deleteApplicationUseCase: DeleteApplicationUseCase;
  bulkUpdateApplicationsUseCase: BulkUpdateApplicationsUseCase;
  bulkDeleteApplicationsUseCase: BulkDeleteApplicationsUseCase;
  bulkAddTagToApplicationsUseCase: BulkAddTagToApplicationsUseCase;
  createNoteUseCase: CreateNoteUseCase;
  getNotesUseCase: GetNotesUseCase;
  updateNoteUseCase: UpdateNoteUseCase;
  deleteNoteUseCase: DeleteNoteUseCase;
  requestUploadUrlUseCase: RequestUploadUrlUseCase;
  confirmDocumentUseCase: ConfirmDocumentUseCase;
  getDocumentsUseCase: GetDocumentsUseCase;
  deleteDocumentUseCase: DeleteDocumentUseCase;
  requestEmailChangeUseCase: RequestEmailChangeUseCase;
  confirmEmailChangeUseCase: ConfirmEmailChangeUseCase;
  updatePasswordUseCase: UpdatePasswordUseCase;
  deleteAccountUseCase: DeleteAccountUseCase;
  exportUserDataUseCase: ExportUserDataUseCase;
  generateTotpSecretUseCase: GenerateTotpSecretUseCase;
  confirmTotpSetupUseCase: ConfirmTotpSetupUseCase;
  disableTotpUseCase: DisableTotpUseCase;
  getTotpStatusUseCase: GetTotpStatusUseCase;
  saveLlmApiKeyUseCase: SaveLlmApiKeyUseCase;
  listLlmApiKeysUseCase: ListLlmApiKeysUseCase;
  deleteLlmApiKeyUseCase: DeleteLlmApiKeyUseCase;
  setDefaultLlmProviderUseCase: SetDefaultLlmProviderUseCase;
  importUserDataUseCase: ImportUserDataUseCase;
  getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase;
  updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase;
  updateProfileUseCase: UpdateProfileUseCase;
  getUserUseCase: GetUserUseCase;
  requestAvatarUploadUrlUseCase: RequestAvatarUploadUrlUseCase;
  confirmAvatarUseCase: ConfirmAvatarUseCase;
  removeAvatarUseCase: RemoveAvatarUseCase;
  createInterviewRoundUseCase: CreateInterviewRoundUseCase;
  getInterviewRoundsUseCase: GetInterviewRoundsUseCase;
  updateInterviewRoundUseCase: UpdateInterviewRoundUseCase;
  deleteInterviewRoundUseCase: DeleteInterviewRoundUseCase;
  getActivityLogsUseCase: GetActivityLogsUseCase;
  getLoginHistoryUseCase: GetLoginHistoryUseCase;
  getChatHistoryUseCase: GetChatHistoryUseCase;
  createConversationUseCase: CreateConversationUseCase;
  listConversationsUseCase: ListConversationsUseCase;
  deleteConversationUseCase: DeleteConversationUseCase;
  createApiTokenUseCase: CreateApiTokenUseCase;
  listApiTokensUseCase: ListApiTokensUseCase;
  deleteApiTokenUseCase: DeleteApiTokenUseCase;
  validateApiTokenUseCase: ValidateApiTokenUseCase;
  createNotificationUseCase: CreateNotificationUseCase;
  getNotificationsPageUseCase: GetNotificationsPageUseCase;
  markNotificationsReadUseCase: MarkNotificationsReadUseCase;
  getUnreadNotificationCountUseCase: GetUnreadNotificationCountUseCase;
  createContactUseCase: CreateContactUseCase;
  getContactsUseCase: GetContactsUseCase;
  updateContactUseCase: UpdateContactUseCase;
  deleteContactUseCase: DeleteContactUseCase;
  emailService: BrevoEmailService;
  deviceLabeler: IDeviceLabeler;
  ipLocationResolver: IIpLocationResolver;
  webPushService: WebPushService;
  pushSubscriptionRepository: DrizzlePushSubscriptionRepository;
  registerPushSubscriptionUseCase: RegisterPushSubscriptionUseCase;
  unregisterPushSubscriptionUseCase: UnregisterPushSubscriptionUseCase;
  sendPushNotificationsUseCase: SendPushNotificationsUseCase;
  sendFollowUpRemindersUseCase: SendFollowUpRemindersUseCase;
  transactionManager: DrizzleTransactionManager;
  llmApiKeyCipher: ILlmApiKeyCipher;
  llmProviderFactory: ILLMProviderFactory;
  documentTextExtractor: IDocumentTextExtractor;
  jobPostingSourceResolver: IJobPostingSourceResolver;
  parseJobDescriptionUseCase: ParseJobDescriptionUseCase;
  generateCoverLetterUseCase: GenerateCoverLetterUseCase;
  computeHealthScoreUseCase: ComputeHealthScoreUseCase;
  chatWithAssistantUseCase: ChatWithAssistantUseCase;
  computeResumeMatchScoreUseCase: ComputeResumeMatchScoreUseCase;
  getCalendarEventsUseCase: GetCalendarEventsUseCase;
  sendWeeklyDigestUseCase: SendWeeklyDigestUseCase;
  createSessionUseCase: CreateSessionUseCase;
  rotateRefreshTokenUseCase: RotateRefreshTokenUseCase;
  listSessionsUseCase: ListSessionsUseCase;
  revokeSessionUseCase: RevokeSessionUseCase;
  revokeOtherSessionsUseCase: RevokeOtherSessionsUseCase;
}

type StorageProviderConstructor = new () => LocalStorageProvider | VercelBlobStorageProvider;
const StorageProvider: StorageProviderConstructor =
  process.env[ENV.STORAGE_PROVIDER] === STORAGE_PROVIDER.VERCEL_BLOB
    ? VercelBlobStorageProvider
    : LocalStorageProvider;

export function buildContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>();
  container.register({
    // Infrastructure
    db: asValue(db),
    storageProvider: asClass(StorageProvider, { lifetime: Lifetime.SINGLETON }),
    generateId: asValue(() => nanoid()),
    webAppOrigin: asValue(
      process.env[ENV.CORS_ORIGIN]?.split(',')[0]?.trim() ?? 'http://localhost:3000',
    ),
    tokenService: asClass(JwtTokenService, { lifetime: Lifetime.SINGLETON }),
    cache: asValue(new MemoryCache()),
    passwordResetRateLimiter: asValue(
      new RateLimiter(
        RATE_LIMIT.PASSWORD_RESET_REQUEST.MAX_ATTEMPTS,
        RATE_LIMIT.PASSWORD_RESET_REQUEST.WINDOW_MS,
      ),
    ),

    // Transaction manager
    transactionManager: asClass(DrizzleTransactionManager, { lifetime: Lifetime.SINGLETON }),

    // Raw repositories
    userRepository: asClass(DrizzleUserRepository, { lifetime: Lifetime.SINGLETON }),
    prismaApplicationRepository: asClass(DrizzleApplicationRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    prismaNoteRepository: asClass(DrizzleNoteRepository, { lifetime: Lifetime.SINGLETON }),
    prismaDocumentRepository: asClass(DrizzleDocumentRepository, { lifetime: Lifetime.SINGLETON }),

    // Cached decorator repositories
    applicationRepository: asClass(CachedApplicationRepository, { lifetime: Lifetime.SINGLETON }),
    noteRepository: asClass(CachedNoteRepository, { lifetime: Lifetime.SINGLETON }),
    documentRepository: asClass(CachedDocumentRepository, { lifetime: Lifetime.SINGLETON }),
    prismaInterviewRoundRepository: asClass(DrizzleInterviewRoundRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    interviewRoundRepository: asClass(CachedInterviewRoundRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    activityLogRepository: asClass(DrizzleActivityLogRepository, { lifetime: Lifetime.SINGLETON }),
    apiTokenRepository: asClass(DrizzleApiTokenRepository, { lifetime: Lifetime.SINGLETON }),
    notificationRepository: asClass(DrizzleNotificationRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    pushSubscriptionRepository: asClass(DrizzlePushSubscriptionRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    contactRepository: asClass(DrizzleContactRepository, { lifetime: Lifetime.SINGLETON }),
    passwordResetTokenRepository: asClass(DrizzlePasswordResetTokenRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    loginEventRepository: asClass(DrizzleLoginEventRepository, { lifetime: Lifetime.SINGLETON }),
    messageRepository: asClass(DrizzleMessageRepository, { lifetime: Lifetime.SINGLETON }),
    conversationRepository: asClass(DrizzleConversationRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    llmApiKeyRepository: asClass(DrizzleLlmApiKeyRepository, { lifetime: Lifetime.SINGLETON }),
    sessionRepository: asClass(DrizzleSessionRepository, { lifetime: Lifetime.SINGLETON }),
    emailVerificationTokenRepository: asClass(DrizzleEmailVerificationTokenRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    totpBackupCodeRepository: asClass(DrizzleTotpBackupCodeRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    totpRateLimiter: asValue(
      new RateLimiter(
        RATE_LIMIT.TOTP_VERIFICATION.MAX_ATTEMPTS,
        RATE_LIMIT.TOTP_VERIFICATION.WINDOW_MS,
      ),
    ),
    chatRateLimiter: asValue(
      new RateLimiter(RATE_LIMIT.CHAT_MESSAGE.MAX_ATTEMPTS, RATE_LIMIT.CHAT_MESSAGE.WINDOW_MS),
    ),
    updatePasswordRateLimiter: asValue(
      new RateLimiter(
        RATE_LIMIT.UPDATE_PASSWORD.MAX_ATTEMPTS,
        RATE_LIMIT.UPDATE_PASSWORD.WINDOW_MS,
      ),
    ),
    requestEmailChangeRateLimiter: asValue(
      new RateLimiter(
        RATE_LIMIT.REQUEST_EMAIL_CHANGE.MAX_ATTEMPTS,
        RATE_LIMIT.REQUEST_EMAIL_CHANGE.WINDOW_MS,
      ),
    ),
    totpProvider: asClass(TotpProvider, { lifetime: Lifetime.SINGLETON }),
    oauthAccountRepository: asClass(DrizzleOAuthAccountRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    googleOAuthProvider: asClass(GoogleOAuthProvider, { lifetime: Lifetime.SINGLETON }),
    gitHubOAuthProvider: asClass(GitHubOAuthProvider, { lifetime: Lifetime.SINGLETON }),
    oauthProviderRegistry: asClass(OAuthProviderRegistry, { lifetime: Lifetime.SINGLETON }),
    oauthStateService: asClass(OAuthStateService, { lifetime: Lifetime.SINGLETON }),

    // Mappers
    applicationMapper: asClass(ApplicationMapper, { lifetime: Lifetime.SINGLETON }),
    apiTokenMapper: asClass(ApiTokenMapper, { lifetime: Lifetime.SINGLETON }),
    notificationMapper: asClass(NotificationMapper, { lifetime: Lifetime.SINGLETON }),
    noteMapper: asClass(NoteMapper, { lifetime: Lifetime.SINGLETON }),
    documentMapper: asClass(DocumentMapper, { lifetime: Lifetime.SINGLETON }),
    userMapper: asClass(UserMapper, { lifetime: Lifetime.SINGLETON }),
    interviewRoundMapper: asClass(InterviewRoundMapper, { lifetime: Lifetime.SINGLETON }),
    activityLogMapper: asClass(ActivityLogMapper, { lifetime: Lifetime.SINGLETON }),
    webPushService: asClass(WebPushService, { lifetime: Lifetime.SINGLETON }),
    contactMapper: asClass(ContactMapper, { lifetime: Lifetime.SINGLETON }),
    loginEventMapper: asClass(LoginEventMapper, { lifetime: Lifetime.SINGLETON }),
    messageMapper: asClass(MessageMapper, { lifetime: Lifetime.SINGLETON }),
    conversationMapper: asClass(ConversationMapper, { lifetime: Lifetime.SINGLETON }),
    llmApiKeyMapper: asClass(LlmApiKeyMapper, { lifetime: Lifetime.SINGLETON }),
    sessionMapper: asClass(SessionMapper, { lifetime: Lifetime.SINGLETON }),
    oauthAccountMapper: asClass(OAuthAccountMapper, { lifetime: Lifetime.SINGLETON }),

    // Resolvers
    authResolver: asClass(AuthResolver, { lifetime: Lifetime.SINGLETON }),
    applicationResolver: asClass(ApplicationResolver, { lifetime: Lifetime.SINGLETON }),
    noteResolver: asClass(NoteResolver, { lifetime: Lifetime.SINGLETON }),
    documentResolver: asClass(DocumentResolver, { lifetime: Lifetime.SINGLETON }),
    userResolver: asClass(UserResolver, { lifetime: Lifetime.SINGLETON }),
    interviewRoundResolver: asClass(InterviewRoundResolver, { lifetime: Lifetime.SINGLETON }),
    activityLogResolver: asClass(ActivityLogResolver, { lifetime: Lifetime.SINGLETON }),
    contactResolver: asClass(ContactResolver, { lifetime: Lifetime.SINGLETON }),
    loginEventResolver: asClass(LoginEventResolver, { lifetime: Lifetime.SINGLETON }),
    apiTokenResolver: asClass(ApiTokenResolver, { lifetime: Lifetime.SINGLETON }),
    notificationResolver: asClass(NotificationResolver, { lifetime: Lifetime.SINGLETON }),
    sessionResolver: asClass(SessionResolver, { lifetime: Lifetime.SINGLETON }),
    oauthResolver: asClass(OAuthResolver, { lifetime: Lifetime.SINGLETON }),
    mcpController: asClass(McpController, { lifetime: Lifetime.SINGLETON }),

    // Use Cases
    loginOrSignupWithOAuthUseCase: asClass(LoginOrSignupWithOAuthUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    linkOAuthAccountUseCase: asClass(LinkOAuthAccountUseCase, { lifetime: Lifetime.TRANSIENT }),
    unlinkOAuthAccountUseCase: asClass(UnlinkOAuthAccountUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    listLinkedOAuthAccountsUseCase: asClass(ListLinkedOAuthAccountsUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    authenticateRequestUseCase: asClass(AuthenticateRequestUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    authenticateMcpRequestUseCase: asClass(AuthenticateMcpRequestUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    registerUseCase: asClass(RegisterUseCase, { lifetime: Lifetime.TRANSIENT }),
    loginUseCase: asClass(LoginUseCase, { lifetime: Lifetime.TRANSIENT }),
    loginWithTotpUseCase: asClass(LoginWithTotpUseCase, { lifetime: Lifetime.TRANSIENT }),
    reauthenticateUseCase: asClass(ReauthenticateUseCase, { lifetime: Lifetime.TRANSIENT }),
    requestPasswordResetUseCase: asClass(RequestPasswordResetUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    resetPasswordUseCase: asClass(ResetPasswordUseCase, { lifetime: Lifetime.TRANSIENT }),
    sendEmailVerificationUseCase: asClass(SendEmailVerificationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    verifyEmailUseCase: asClass(VerifyEmailUseCase, { lifetime: Lifetime.TRANSIENT }),
    createApplicationUseCase: asClass(CreateApplicationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    getApplicationsUseCase: asClass(GetApplicationsUseCase, { lifetime: Lifetime.TRANSIENT }),
    getApplicationsPageUseCase: asClass(GetApplicationsPageUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    getApplicationUseCase: asClass(GetApplicationUseCase, { lifetime: Lifetime.TRANSIENT }),
    updateApplicationUseCase: asClass(UpdateApplicationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    deleteApplicationUseCase: asClass(DeleteApplicationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    bulkUpdateApplicationsUseCase: asClass(BulkUpdateApplicationsUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    bulkDeleteApplicationsUseCase: asClass(BulkDeleteApplicationsUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    bulkAddTagToApplicationsUseCase: asClass(BulkAddTagToApplicationsUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    createNoteUseCase: asClass(CreateNoteUseCase, { lifetime: Lifetime.TRANSIENT }),
    getNotesUseCase: asClass(GetNotesUseCase, { lifetime: Lifetime.TRANSIENT }),
    updateNoteUseCase: asClass(UpdateNoteUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteNoteUseCase: asClass(DeleteNoteUseCase, { lifetime: Lifetime.TRANSIENT }),
    requestUploadUrlUseCase: asClass(RequestUploadUrlUseCase, { lifetime: Lifetime.TRANSIENT }),
    confirmDocumentUseCase: asClass(ConfirmDocumentUseCase, { lifetime: Lifetime.TRANSIENT }),
    getDocumentsUseCase: asClass(GetDocumentsUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteDocumentUseCase: asClass(DeleteDocumentUseCase, { lifetime: Lifetime.TRANSIENT }),
    requestEmailChangeUseCase: asClass(RequestEmailChangeUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    confirmEmailChangeUseCase: asClass(ConfirmEmailChangeUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    updatePasswordUseCase: asClass(UpdatePasswordUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteAccountUseCase: asClass(DeleteAccountUseCase, { lifetime: Lifetime.TRANSIENT }),
    exportUserDataUseCase: asClass(ExportUserDataUseCase, { lifetime: Lifetime.TRANSIENT }),
    generateTotpSecretUseCase: asClass(GenerateTotpSecretUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    confirmTotpSetupUseCase: asClass(ConfirmTotpSetupUseCase, { lifetime: Lifetime.TRANSIENT }),
    disableTotpUseCase: asClass(DisableTotpUseCase, { lifetime: Lifetime.TRANSIENT }),
    getTotpStatusUseCase: asClass(GetTotpStatusUseCase, { lifetime: Lifetime.TRANSIENT }),
    saveLlmApiKeyUseCase: asClass(SaveLlmApiKeyUseCase, { lifetime: Lifetime.TRANSIENT }),
    listLlmApiKeysUseCase: asClass(ListLlmApiKeysUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteLlmApiKeyUseCase: asClass(DeleteLlmApiKeyUseCase, { lifetime: Lifetime.TRANSIENT }),
    setDefaultLlmProviderUseCase: asClass(SetDefaultLlmProviderUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    importUserDataUseCase: asClass(ImportUserDataUseCase, { lifetime: Lifetime.TRANSIENT }),
    getNotificationPreferencesUseCase: asClass(GetNotificationPreferencesUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    updateNotificationPreferencesUseCase: asClass(UpdateNotificationPreferencesUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    updateProfileUseCase: asClass(UpdateProfileUseCase, { lifetime: Lifetime.TRANSIENT }),
    getUserUseCase: asClass(GetUserUseCase, { lifetime: Lifetime.TRANSIENT }),
    requestAvatarUploadUrlUseCase: asClass(RequestAvatarUploadUrlUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    confirmAvatarUseCase: asClass(ConfirmAvatarUseCase, { lifetime: Lifetime.TRANSIENT }),
    removeAvatarUseCase: asClass(RemoveAvatarUseCase, { lifetime: Lifetime.TRANSIENT }),
    createInterviewRoundUseCase: asClass(CreateInterviewRoundUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    getInterviewRoundsUseCase: asClass(GetInterviewRoundsUseCase, { lifetime: Lifetime.TRANSIENT }),
    updateInterviewRoundUseCase: asClass(UpdateInterviewRoundUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    deleteInterviewRoundUseCase: asClass(DeleteInterviewRoundUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    getActivityLogsUseCase: asClass(GetActivityLogsUseCase, { lifetime: Lifetime.TRANSIENT }),
    getLoginHistoryUseCase: asClass(GetLoginHistoryUseCase, { lifetime: Lifetime.TRANSIENT }),
    getChatHistoryUseCase: asClass(GetChatHistoryUseCase, { lifetime: Lifetime.TRANSIENT }),
    createConversationUseCase: asClass(CreateConversationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    listConversationsUseCase: asClass(ListConversationsUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteConversationUseCase: asClass(DeleteConversationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    createApiTokenUseCase: asClass(CreateApiTokenUseCase, { lifetime: Lifetime.TRANSIENT }),
    listApiTokensUseCase: asClass(ListApiTokensUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteApiTokenUseCase: asClass(DeleteApiTokenUseCase, { lifetime: Lifetime.TRANSIENT }),
    validateApiTokenUseCase: asClass(ValidateApiTokenUseCase, { lifetime: Lifetime.TRANSIENT }),
    createNotificationUseCase: asClass(CreateNotificationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    getNotificationsPageUseCase: asClass(GetNotificationsPageUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    markNotificationsReadUseCase: asClass(MarkNotificationsReadUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    getUnreadNotificationCountUseCase: asClass(GetUnreadNotificationCountUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    createContactUseCase: asClass(CreateContactUseCase, { lifetime: Lifetime.TRANSIENT }),
    getContactsUseCase: asClass(GetContactsUseCase, { lifetime: Lifetime.TRANSIENT }),
    updateContactUseCase: asClass(UpdateContactUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteContactUseCase: asClass(DeleteContactUseCase, { lifetime: Lifetime.TRANSIENT }),
    emailService: asClass(BrevoEmailService, { lifetime: Lifetime.SINGLETON }),
    deviceLabeler: asClass(DeviceLabelService, { lifetime: Lifetime.SINGLETON }),
    ipLocationResolver: asClass(IpLocationService, { lifetime: Lifetime.SINGLETON }),
    registerPushSubscriptionUseCase: asClass(RegisterPushSubscriptionUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    unregisterPushSubscriptionUseCase: asClass(UnregisterPushSubscriptionUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    sendPushNotificationsUseCase: asClass(SendPushNotificationsUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    sendFollowUpRemindersUseCase: asClass(SendFollowUpRemindersUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    llmApiKeyCipher: asClass(LlmApiKeyCipher, { lifetime: Lifetime.SINGLETON }),
    llmProviderFactory: asClass(UserLLMProviderFactory, { lifetime: Lifetime.SINGLETON }),
    documentTextExtractor: asClass(DocumentTextExtractor, { lifetime: Lifetime.SINGLETON }),
    jobPostingSourceResolver: asClass(FetchJobPostingSourceResolver, {
      lifetime: Lifetime.SINGLETON,
    }),
    parseJobDescriptionUseCase: asClass(ParseJobDescriptionUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    generateCoverLetterUseCase: asClass(GenerateCoverLetterUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    computeHealthScoreUseCase: asClass(ComputeHealthScoreUseCase, { lifetime: Lifetime.TRANSIENT }),
    chatWithAssistantUseCase: asClass(ChatWithAssistantUseCase, { lifetime: Lifetime.TRANSIENT }),
    getCalendarEventsUseCase: asClass(GetCalendarEventsUseCase, { lifetime: Lifetime.TRANSIENT }),
    computeResumeMatchScoreUseCase: asClass(ComputeResumeMatchScoreUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    sendWeeklyDigestUseCase: asClass(SendWeeklyDigestUseCase, { lifetime: Lifetime.TRANSIENT }),
    createSessionUseCase: asClass(CreateSessionUseCase, { lifetime: Lifetime.TRANSIENT }),
    rotateRefreshTokenUseCase: asClass(RotateRefreshTokenUseCase, { lifetime: Lifetime.TRANSIENT }),
    listSessionsUseCase: asClass(ListSessionsUseCase, { lifetime: Lifetime.TRANSIENT }),
    revokeSessionUseCase: asClass(RevokeSessionUseCase, { lifetime: Lifetime.TRANSIENT }),
    revokeOtherSessionsUseCase: asClass(RevokeOtherSessionsUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
  });
  return container;
}
