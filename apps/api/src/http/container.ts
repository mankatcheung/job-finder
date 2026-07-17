import { nanoid } from 'nanoid';
import { asClass, asValue, Lifetime } from 'awilix';
import { diContainer } from '@fastify/awilix';

import { prisma } from '@/infrastructure/db/client.js';

import { PrismaUserRepository } from '@/infrastructure/db/repositories/PrismaUserRepository.js';
import { PrismaApplicationRepository } from '@/infrastructure/db/repositories/PrismaApplicationRepository.js';
import { PrismaNoteRepository } from '@/infrastructure/db/repositories/PrismaNoteRepository.js';
import { PrismaDocumentRepository } from '@/infrastructure/db/repositories/PrismaDocumentRepository.js';

import { LocalStorageProvider } from '@/infrastructure/storage/LocalStorageProvider.js';
import { R2StorageProvider } from '@/infrastructure/storage/R2StorageProvider.js';

import { ApplicationMapper } from '@/interface-adapters/mappers/ApplicationMapper.js';
import { NoteMapper } from '@/interface-adapters/mappers/NoteMapper.js';
import { DocumentMapper } from '@/interface-adapters/mappers/DocumentMapper.js';

import { AuthResolver } from '@/interface-adapters/resolvers/AuthResolver.js';
import { ApplicationResolver } from '@/interface-adapters/resolvers/ApplicationResolver.js';
import { NoteResolver } from '@/interface-adapters/resolvers/NoteResolver.js';
import { DocumentResolver } from '@/interface-adapters/resolvers/DocumentResolver.js';

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

import type { FastifyInstance } from 'fastify';

// Augment the @fastify/awilix Cradle interface so diContainer and diScope are fully typed
declare module '@fastify/awilix' {
  interface Cradle {
    prisma: typeof prisma;
    storageProvider: LocalStorageProvider | R2StorageProvider;
    generateId: () => string;
    fastify: FastifyInstance;

    userRepository: PrismaUserRepository;
    applicationRepository: PrismaApplicationRepository;
    noteRepository: PrismaNoteRepository;
    documentRepository: PrismaDocumentRepository;

    applicationMapper: ApplicationMapper;
    noteMapper: NoteMapper;
    documentMapper: DocumentMapper;

    authResolver: AuthResolver;
    applicationResolver: ApplicationResolver;
    noteResolver: NoteResolver;
    documentResolver: DocumentResolver;

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

    // Repositories
    userRepository: asClass(PrismaUserRepository, { lifetime: Lifetime.SINGLETON }),
    applicationRepository: asClass(PrismaApplicationRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
    noteRepository: asClass(PrismaNoteRepository, { lifetime: Lifetime.SINGLETON }),
    documentRepository: asClass(PrismaDocumentRepository, { lifetime: Lifetime.SINGLETON }),

    // Mappers
    applicationMapper: asClass(ApplicationMapper, { lifetime: Lifetime.SINGLETON }),
    noteMapper: asClass(NoteMapper, { lifetime: Lifetime.SINGLETON }),
    documentMapper: asClass(DocumentMapper, { lifetime: Lifetime.SINGLETON }),

    // Resolvers
    authResolver: asClass(AuthResolver, { lifetime: Lifetime.SINGLETON }),
    applicationResolver: asClass(ApplicationResolver, { lifetime: Lifetime.SINGLETON }),
    noteResolver: asClass(NoteResolver, { lifetime: Lifetime.SINGLETON }),
    documentResolver: asClass(DocumentResolver, { lifetime: Lifetime.SINGLETON }),

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
  });
}
