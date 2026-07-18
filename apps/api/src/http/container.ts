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

import { LocalStorageProvider } from '@/infrastructure/storage/LocalStorageProvider.js';
import { R2StorageProvider } from '@/infrastructure/storage/R2StorageProvider.js';

import { ApplicationMapper } from '@/interface-adapters/mappers/ApplicationMapper.js';
import { NoteMapper } from '@/interface-adapters/mappers/NoteMapper.js';
import { DocumentMapper } from '@/interface-adapters/mappers/DocumentMapper.js';
import { InterviewRoundMapper } from '@/interface-adapters/mappers/InterviewRoundMapper.js';

import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { ApplicationResolver } from '@/interface-adapters/resolvers/ApplicationResolver.js';
import { NoteResolver } from '@/interface-adapters/resolvers/NoteResolver.js';
import { DocumentResolver } from '@/interface-adapters/resolvers/DocumentResolver.js';
import { UserResolver } from '@/interface-adapters/resolvers/UserResolver.js';
import { InterviewRoundResolver } from '@/interface-adapters/resolvers/InterviewRoundResolver.js';

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

import type { FastifyInstance } from 'fastify';

// Augment the @fastify/awilix Cradle interface so diContainer and diScope are fully typed
declare module '@fastify/awilix' {
  interface Cradle {
    prisma: typeof prisma;
    storageProvider: LocalStorageProvider | R2StorageProvider;
    generateId: () => string;
    fastify: FastifyInstance;
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

    applicationMapper: ApplicationMapper;
    noteMapper: NoteMapper;
    documentMapper: DocumentMapper;
    interviewRoundMapper: InterviewRoundMapper;

    authResolver: AuthResolver;
    applicationResolver: ApplicationResolver;
    noteResolver: NoteResolver;
    documentResolver: DocumentResolver;
    userResolver: UserResolver;
    interviewRoundResolver: InterviewRoundResolver;

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
  }
}

type StorageProviderConstructor = new () => LocalStorageProvider | R2StorageProvider;
const StorageProvider: StorageProviderConstructor =
  process.env.STORAGE_PROVIDER === 'r2' ? R2StorageProvider : LocalStorageProvider;

export function buildContainer(fastify: FastifyInstance): void {
  diContainer.register({
    // Infrastructure
    prisma: asValue(prisma),
    storageProvider: asClass(StorageProvider, { lifetime: Lifetime.SINGLETON }),
    generateId: asValue(() => nanoid()),
    fastify: asValue(fastify),
    cache: asValue(new MemoryCache()),

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
    prismaInterviewRoundRepository: asClass(PrismaInterviewRoundRepository, { lifetime: Lifetime.SINGLETON }),
    interviewRoundRepository: asClass(CachedInterviewRoundRepository, { lifetime: Lifetime.SINGLETON }),

    // Mappers
    applicationMapper: asClass(ApplicationMapper, { lifetime: Lifetime.SINGLETON }),
    noteMapper: asClass(NoteMapper, { lifetime: Lifetime.SINGLETON }),
    documentMapper: asClass(DocumentMapper, { lifetime: Lifetime.SINGLETON }),
    interviewRoundMapper: asClass(InterviewRoundMapper, { lifetime: Lifetime.SINGLETON }),

    // Resolvers
    authResolver: asClass(AuthResolver, { lifetime: Lifetime.SINGLETON }),
    applicationResolver: asClass(ApplicationResolver, { lifetime: Lifetime.SINGLETON }),
    noteResolver: asClass(NoteResolver, { lifetime: Lifetime.SINGLETON }),
    documentResolver: asClass(DocumentResolver, { lifetime: Lifetime.SINGLETON }),
    userResolver: asClass(UserResolver, { lifetime: Lifetime.SINGLETON }),
    interviewRoundResolver: asClass(InterviewRoundResolver, { lifetime: Lifetime.SINGLETON }),

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
    createInterviewRoundUseCase: asClass(CreateInterviewRoundUseCase, { lifetime: Lifetime.TRANSIENT }),
    getInterviewRoundsUseCase: asClass(GetInterviewRoundsUseCase, { lifetime: Lifetime.TRANSIENT }),
    updateInterviewRoundUseCase: asClass(UpdateInterviewRoundUseCase, { lifetime: Lifetime.TRANSIENT }),
    deleteInterviewRoundUseCase: asClass(DeleteInterviewRoundUseCase, { lifetime: Lifetime.TRANSIENT }),
  });
}
