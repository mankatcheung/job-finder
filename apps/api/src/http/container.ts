import { nanoid } from 'nanoid';
import { asClass, asValue, Lifetime } from 'awilix';
import { diContainer } from '@fastify/awilix';

import { prisma } from '@/infrastructure/db/client.js';

import { MemoryCache } from '@/infrastructure/cache/MemoryCache.js';
import { PrismaUserRepository } from '@/infrastructure/db/repositories/PrismaUserRepository.js';
import { PrismaApplicationRepository } from '@/infrastructure/db/repositories/PrismaApplicationRepository.js';
import { PrismaNoteRepository } from '@/infrastructure/db/repositories/PrismaNoteRepository.js';
import { PrismaDocumentRepository } from '@/infrastructure/db/repositories/PrismaDocumentRepository.js';
import { CachedApplicationRepository } from '@/infrastructure/db/repositories/CachedApplicationRepository.js';
import { CachedNoteRepository } from '@/infrastructure/db/repositories/CachedNoteRepository.js';
import { CachedDocumentRepository } from '@/infrastructure/db/repositories/CachedDocumentRepository.js';
import { PrismaInterviewRoundRepository } from '@/infrastructure/db/repositories/PrismaInterviewRoundRepository.js';
import { CachedInterviewRoundRepository } from '@/infrastructure/db/repositories/CachedInterviewRoundRepository.js';
import { PrismaActivityLogRepository } from '@/infrastructure/db/repositories/PrismaActivityLogRepository.js';
import { PrismaContactRepository } from '@/infrastructure/db/repositories/PrismaContactRepository.js';
import { PrismaSessionRepository } from '@/infrastructure/db/repositories/PrismaSessionRepository.js';

import { LocalStorageProvider } from '@/infrastructure/storage/LocalStorageProvider.js';
import { R2StorageProvider } from '@/infrastructure/storage/R2StorageProvider.js';

import { ApplicationMapper } from '@/interface-adapters/mappers/ApplicationMapper.js';
import { NoteMapper } from '@/interface-adapters/mappers/NoteMapper.js';
import { DocumentMapper } from '@/interface-adapters/mappers/DocumentMapper.js';
import { InterviewRoundMapper } from '@/interface-adapters/mappers/InterviewRoundMapper.js';
import { ActivityLogMapper } from '@/interface-adapters/mappers/ActivityLogMapper.js';
import { ContactMapper } from '@/interface-adapters/mappers/ContactMapper.js';
import { SessionMapper } from '@/interface-adapters/mappers/SessionMapper.js';

import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { ApplicationResolver } from '@/interface-adapters/resolvers/ApplicationResolver.js';
import { NoteResolver } from '@/interface-adapters/resolvers/NoteResolver.js';
import { DocumentResolver } from '@/interface-adapters/resolvers/DocumentResolver.js';
import { UserResolver } from '@/interface-adapters/resolvers/UserResolver.js';
import { InterviewRoundResolver } from '@/interface-adapters/resolvers/InterviewRoundResolver.js';
import { ActivityLogResolver } from '@/interface-adapters/resolvers/ActivityLogResolver.js';
import { ContactResolver } from '@/interface-adapters/resolvers/ContactResolver.js';
import { McpController } from '@/interface-adapters/mcp/McpController.js';

import { RegisterUseCase } from '@/use-cases/auth/RegisterUseCase.js';
import { LoginUseCase } from '@/use-cases/auth/LoginUseCase.js';
import { CreateApplicationUseCase } from '@/use-cases/jobs/CreateApplicationUseCase.js';
import { GetApplicationsUseCase } from '@/use-cases/jobs/GetApplicationsUseCase.js';
import { GetApplicationUseCase } from '@/use-cases/jobs/GetApplicationUseCase.js';
import { UpdateApplicationUseCase } from '@/use-cases/jobs/UpdateApplicationUseCase.js';
import { DeleteApplicationUseCase } from '@/use-cases/jobs/DeleteApplicationUseCase.js';
import { CreateNoteUseCase } from '@/use-cases/notes/CreateNoteUseCase.js';
import { GetNotesUseCase } from '@/use-cases/notes/GetNotesUseCase.js';
import { UpdateNoteUseCase } from '@/use-cases/notes/UpdateNoteUseCase.js';
import { DeleteNoteUseCase } from '@/use-cases/notes/DeleteNoteUseCase.js';
import { RequestUploadUrlUseCase } from '@/use-cases/documents/RequestUploadUrlUseCase.js';
import { ConfirmDocumentUseCase } from '@/use-cases/documents/ConfirmDocumentUseCase.js';
import { GetDocumentsUseCase } from '@/use-cases/documents/GetDocumentsUseCase.js';
import { DeleteDocumentUseCase } from '@/use-cases/documents/DeleteDocumentUseCase.js';
import { UpdateEmailUseCase } from '@/use-cases/user/UpdateEmailUseCase.js';
import { UpdatePasswordUseCase } from '@/use-cases/user/UpdatePasswordUseCase.js';
import { DeleteAccountUseCase } from '@/use-cases/user/DeleteAccountUseCase.js';
import { ExportUserDataUseCase } from '@/use-cases/user/ExportUserDataUseCase.js';
import { CreateInterviewRoundUseCase } from '@/use-cases/interviewRounds/CreateInterviewRoundUseCase.js';
import { GetInterviewRoundsUseCase } from '@/use-cases/interviewRounds/GetInterviewRoundsUseCase.js';
import { UpdateInterviewRoundUseCase } from '@/use-cases/interviewRounds/UpdateInterviewRoundUseCase.js';
import { DeleteInterviewRoundUseCase } from '@/use-cases/interviewRounds/DeleteInterviewRoundUseCase.js';
import { GetActivityLogsUseCase } from '@/use-cases/activityLogs/GetActivityLogsUseCase.js';
import { FastifyJwtTokenService } from '@/infrastructure/auth/FastifyJwtTokenService.js';
import { PrismaApiTokenRepository } from '@/infrastructure/db/repositories/PrismaApiTokenRepository.js';
import { ApiTokenMapper } from '@/interface-adapters/mappers/ApiTokenMapper.js';
import { CreateApiTokenUseCase } from '@/use-cases/apiTokens/CreateApiTokenUseCase.js';
import { ListApiTokensUseCase } from '@/use-cases/apiTokens/ListApiTokensUseCase.js';
import { DeleteApiTokenUseCase } from '@/use-cases/apiTokens/DeleteApiTokenUseCase.js';
import { ValidateApiTokenUseCase } from '@/use-cases/apiTokens/ValidateApiTokenUseCase.js';
import { CreateContactUseCase } from '@/use-cases/contacts/CreateContactUseCase.js';
import { GetContactsUseCase } from '@/use-cases/contacts/GetContactsUseCase.js';
import { UpdateContactUseCase } from '@/use-cases/contacts/UpdateContactUseCase.js';
import { DeleteContactUseCase } from '@/use-cases/contacts/DeleteContactUseCase.js';
import { BrevoEmailService } from '@/infrastructure/email/BrevoEmailService.js';
import { SendFollowUpRemindersUseCase } from '@/use-cases/reminders/SendFollowUpRemindersUseCase.js';
import { PrismaTransactionManager } from '@/infrastructure/db/PrismaTransactionManager.js';
import { OpenRouterLLMProvider } from '@/infrastructure/llm/OpenRouterLLMProvider.js';
import { GoogleAILLMProvider } from '@/infrastructure/llm/GoogleAILLMProvider.js';
import { ParseJobDescriptionUseCase } from '@/use-cases/jobDescription/ParseJobDescriptionUseCase.js';
import { GenerateCoverLetterUseCase } from '@/use-cases/coverLetter/GenerateCoverLetterUseCase.js';
import { ComputeHealthScoreUseCase } from '@/use-cases/application/ComputeHealthScoreUseCase.js';
import { SendWeeklyDigestUseCase } from '@/use-cases/digest/SendWeeklyDigestUseCase.js';
import { CreateSessionUseCase } from '@/use-cases/sessions/CreateSessionUseCase.js';
import { TouchSessionUseCase } from '@/use-cases/sessions/TouchSessionUseCase.js';
import { ListSessionsUseCase } from '@/use-cases/sessions/ListSessionsUseCase.js';
import { RevokeSessionUseCase } from '@/use-cases/sessions/RevokeSessionUseCase.js';
import { RevokeOtherSessionsUseCase } from '@/use-cases/sessions/RevokeOtherSessionsUseCase.js';

import type { FastifyInstance } from 'fastify';
import { ENV, LLM_PROVIDER, STORAGE_PROVIDER } from '@/constants.js';
import type { ILLMProvider } from '@/use-cases/ports/ILLMProvider.js';

// Augment the @fastify/awilix Cradle interface so diContainer and diScope are fully typed
declare module '@fastify/awilix' {
  interface Cradle {
    prisma: typeof prisma;
    storageProvider: LocalStorageProvider | R2StorageProvider;
    generateId: () => string;
    fastify: FastifyInstance;
    tokenService: FastifyJwtTokenService;
    cache: MemoryCache;

    // Raw Prisma repositories (used internally by the cached decorators)
    userRepository: PrismaUserRepository;
    prismaApplicationRepository: PrismaApplicationRepository;
    prismaNoteRepository: PrismaNoteRepository;
    prismaDocumentRepository: PrismaDocumentRepository;

    // Cached repository decorators (what use-cases consume)
    applicationRepository: CachedApplicationRepository;
    noteRepository: CachedNoteRepository;
    documentRepository: CachedDocumentRepository;
    prismaInterviewRoundRepository: PrismaInterviewRoundRepository;
    interviewRoundRepository: CachedInterviewRoundRepository;
    activityLogRepository: PrismaActivityLogRepository;
    apiTokenRepository: PrismaApiTokenRepository;
    contactRepository: PrismaContactRepository;
    sessionRepository: PrismaSessionRepository;

    applicationMapper: ApplicationMapper;
    apiTokenMapper: ApiTokenMapper;
    noteMapper: NoteMapper;
    documentMapper: DocumentMapper;
    interviewRoundMapper: InterviewRoundMapper;
    activityLogMapper: ActivityLogMapper;
    contactMapper: ContactMapper;
    sessionMapper: SessionMapper;

    authResolver: AuthResolver;
    applicationResolver: ApplicationResolver;
    noteResolver: NoteResolver;
    documentResolver: DocumentResolver;
    userResolver: UserResolver;
    interviewRoundResolver: InterviewRoundResolver;
    activityLogResolver: ActivityLogResolver;
    contactResolver: ContactResolver;
    mcpController: McpController;

    registerUseCase: RegisterUseCase;
    loginUseCase: LoginUseCase;
    createApplicationUseCase: CreateApplicationUseCase;
    getApplicationsUseCase: GetApplicationsUseCase;
    getApplicationUseCase: GetApplicationUseCase;
    updateApplicationUseCase: UpdateApplicationUseCase;
    deleteApplicationUseCase: DeleteApplicationUseCase;
    createNoteUseCase: CreateNoteUseCase;
    getNotesUseCase: GetNotesUseCase;
    updateNoteUseCase: UpdateNoteUseCase;
    deleteNoteUseCase: DeleteNoteUseCase;
    requestUploadUrlUseCase: RequestUploadUrlUseCase;
    confirmDocumentUseCase: ConfirmDocumentUseCase;
    getDocumentsUseCase: GetDocumentsUseCase;
    deleteDocumentUseCase: DeleteDocumentUseCase;
    updateEmailUseCase: UpdateEmailUseCase;
    updatePasswordUseCase: UpdatePasswordUseCase;
    deleteAccountUseCase: DeleteAccountUseCase;
    exportUserDataUseCase: ExportUserDataUseCase;
    createInterviewRoundUseCase: CreateInterviewRoundUseCase;
    getInterviewRoundsUseCase: GetInterviewRoundsUseCase;
    updateInterviewRoundUseCase: UpdateInterviewRoundUseCase;
    deleteInterviewRoundUseCase: DeleteInterviewRoundUseCase;
    getActivityLogsUseCase: GetActivityLogsUseCase;
    createApiTokenUseCase: CreateApiTokenUseCase;
    listApiTokensUseCase: ListApiTokensUseCase;
    deleteApiTokenUseCase: DeleteApiTokenUseCase;
    validateApiTokenUseCase: ValidateApiTokenUseCase;
    createContactUseCase: CreateContactUseCase;
    getContactsUseCase: GetContactsUseCase;
    updateContactUseCase: UpdateContactUseCase;
    deleteContactUseCase: DeleteContactUseCase;
    emailService: BrevoEmailService;
    sendFollowUpRemindersUseCase: SendFollowUpRemindersUseCase;
    transactionManager: PrismaTransactionManager;
    llmProvider: ILLMProvider;
    parseJobDescriptionUseCase: ParseJobDescriptionUseCase;
    generateCoverLetterUseCase: GenerateCoverLetterUseCase;
    computeHealthScoreUseCase: ComputeHealthScoreUseCase;
    sendWeeklyDigestUseCase: SendWeeklyDigestUseCase;
    createSessionUseCase: CreateSessionUseCase;
    touchSessionUseCase: TouchSessionUseCase;
    listSessionsUseCase: ListSessionsUseCase;
    revokeSessionUseCase: RevokeSessionUseCase;
    revokeOtherSessionsUseCase: RevokeOtherSessionsUseCase;
  }
}

type StorageProviderConstructor = new () => LocalStorageProvider | R2StorageProvider;
const StorageProvider: StorageProviderConstructor =
  process.env[ENV.STORAGE_PROVIDER] === STORAGE_PROVIDER.R2
    ? R2StorageProvider
    : LocalStorageProvider;

type LLMProviderConstructor = new () => ILLMProvider;
const LLMProvider: LLMProviderConstructor =
  process.env[ENV.LLM_PROVIDER] === LLM_PROVIDER.GOOGLEAI
    ? GoogleAILLMProvider
    : OpenRouterLLMProvider;

export function buildContainer(fastify: FastifyInstance): void {
  diContainer.register({
    // Infrastructure
    prisma: asValue(prisma),
    storageProvider: asClass(StorageProvider, { lifetime: Lifetime.SINGLETON }),
    generateId: asValue(() => nanoid()),
    fastify: asValue(fastify),
    tokenService: asClass(FastifyJwtTokenService, { lifetime: Lifetime.SINGLETON }),
    cache: asValue(new MemoryCache()),

    // Transaction manager
    transactionManager: asClass(PrismaTransactionManager, { lifetime: Lifetime.SINGLETON }),

    // Raw Prisma repositories
    userRepository: asClass(PrismaUserRepository, { lifetime: Lifetime.SINGLETON }),
    prismaApplicationRepository: asClass(PrismaApplicationRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    prismaNoteRepository: asClass(PrismaNoteRepository, { lifetime: Lifetime.SINGLETON }),
    prismaDocumentRepository: asClass(PrismaDocumentRepository, { lifetime: Lifetime.SINGLETON }),

    // Cached decorator repositories
    applicationRepository: asClass(CachedApplicationRepository, { lifetime: Lifetime.SINGLETON }),
    noteRepository: asClass(CachedNoteRepository, { lifetime: Lifetime.SINGLETON }),
    documentRepository: asClass(CachedDocumentRepository, { lifetime: Lifetime.SINGLETON }),
    prismaInterviewRoundRepository: asClass(PrismaInterviewRoundRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    interviewRoundRepository: asClass(CachedInterviewRoundRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    activityLogRepository: asClass(PrismaActivityLogRepository, { lifetime: Lifetime.SINGLETON }),
    apiTokenRepository: asClass(PrismaApiTokenRepository, { lifetime: Lifetime.SINGLETON }),
    contactRepository: asClass(PrismaContactRepository, { lifetime: Lifetime.SINGLETON }),
    sessionRepository: asClass(PrismaSessionRepository, { lifetime: Lifetime.SINGLETON }),

    // Mappers
    applicationMapper: asClass(ApplicationMapper, { lifetime: Lifetime.SINGLETON }),
    apiTokenMapper: asClass(ApiTokenMapper, { lifetime: Lifetime.SINGLETON }),
    noteMapper: asClass(NoteMapper, { lifetime: Lifetime.SINGLETON }),
    documentMapper: asClass(DocumentMapper, { lifetime: Lifetime.SINGLETON }),
    interviewRoundMapper: asClass(InterviewRoundMapper, { lifetime: Lifetime.SINGLETON }),
    activityLogMapper: asClass(ActivityLogMapper, { lifetime: Lifetime.SINGLETON }),
    contactMapper: asClass(ContactMapper, { lifetime: Lifetime.SINGLETON }),
    sessionMapper: asClass(SessionMapper, { lifetime: Lifetime.SINGLETON }),

    // Resolvers
    authResolver: asClass(AuthResolver, { lifetime: Lifetime.SINGLETON }),
    applicationResolver: asClass(ApplicationResolver, { lifetime: Lifetime.SINGLETON }),
    noteResolver: asClass(NoteResolver, { lifetime: Lifetime.SINGLETON }),
    documentResolver: asClass(DocumentResolver, { lifetime: Lifetime.SINGLETON }),
    userResolver: asClass(UserResolver, { lifetime: Lifetime.SINGLETON }),
    interviewRoundResolver: asClass(InterviewRoundResolver, { lifetime: Lifetime.SINGLETON }),
    activityLogResolver: asClass(ActivityLogResolver, { lifetime: Lifetime.SINGLETON }),
    contactResolver: asClass(ContactResolver, { lifetime: Lifetime.SINGLETON }),
    mcpController: asClass(McpController, { lifetime: Lifetime.SINGLETON }),

    // Use Cases
    registerUseCase: asClass(RegisterUseCase, { lifetime: Lifetime.TRANSIENT }),
    loginUseCase: asClass(LoginUseCase, { lifetime: Lifetime.TRANSIENT }),
    createApplicationUseCase: asClass(CreateApplicationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    getApplicationsUseCase: asClass(GetApplicationsUseCase, { lifetime: Lifetime.TRANSIENT }),
    getApplicationUseCase: asClass(GetApplicationUseCase, { lifetime: Lifetime.TRANSIENT }),
    updateApplicationUseCase: asClass(UpdateApplicationUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    deleteApplicationUseCase: asClass(DeleteApplicationUseCase, {
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
    updateEmailUseCase: asClass(UpdateEmailUseCase, { lifetime: Lifetime.TRANSIENT }),
    updatePasswordUseCase: asClass(UpdatePasswordUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteAccountUseCase: asClass(DeleteAccountUseCase, { lifetime: Lifetime.TRANSIENT }),
    exportUserDataUseCase: asClass(ExportUserDataUseCase, { lifetime: Lifetime.TRANSIENT }),
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
    createApiTokenUseCase: asClass(CreateApiTokenUseCase, { lifetime: Lifetime.TRANSIENT }),
    listApiTokensUseCase: asClass(ListApiTokensUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteApiTokenUseCase: asClass(DeleteApiTokenUseCase, { lifetime: Lifetime.TRANSIENT }),
    validateApiTokenUseCase: asClass(ValidateApiTokenUseCase, { lifetime: Lifetime.TRANSIENT }),
    createContactUseCase: asClass(CreateContactUseCase, { lifetime: Lifetime.TRANSIENT }),
    getContactsUseCase: asClass(GetContactsUseCase, { lifetime: Lifetime.TRANSIENT }),
    updateContactUseCase: asClass(UpdateContactUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteContactUseCase: asClass(DeleteContactUseCase, { lifetime: Lifetime.TRANSIENT }),
    emailService: asClass(BrevoEmailService, { lifetime: Lifetime.SINGLETON }),
    sendFollowUpRemindersUseCase: asClass(SendFollowUpRemindersUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    llmProvider: asClass(LLMProvider, { lifetime: Lifetime.SINGLETON }),
    parseJobDescriptionUseCase: asClass(ParseJobDescriptionUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    generateCoverLetterUseCase: asClass(GenerateCoverLetterUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
    computeHealthScoreUseCase: asClass(ComputeHealthScoreUseCase, { lifetime: Lifetime.TRANSIENT }),
    sendWeeklyDigestUseCase: asClass(SendWeeklyDigestUseCase, { lifetime: Lifetime.TRANSIENT }),
    createSessionUseCase: asClass(CreateSessionUseCase, { lifetime: Lifetime.TRANSIENT }),
    touchSessionUseCase: asClass(TouchSessionUseCase, { lifetime: Lifetime.TRANSIENT }),
    listSessionsUseCase: asClass(ListSessionsUseCase, { lifetime: Lifetime.TRANSIENT }),
    revokeSessionUseCase: asClass(RevokeSessionUseCase, { lifetime: Lifetime.TRANSIENT }),
    revokeOtherSessionsUseCase: asClass(RevokeOtherSessionsUseCase, {
      lifetime: Lifetime.TRANSIENT,
    }),
  });
}
