import { vi } from 'vitest';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IDocumentRepository } from '@/use-cases/ports/IDocumentRepository.js';
import type { INoteRepository } from '@/use-cases/ports/INoteRepository.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import type { User } from '@/domain/user/User.js';
import type { Application } from '@/domain/application/Application.js';
import type { Document } from '@/domain/document/Document.js';
import type { Note } from '@/domain/note/Note.js';

export const makeUserRepository = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
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

export const makeStorageProvider = (overrides?: Partial<IStorageProvider>): IStorageProvider => ({
  getPresignedUploadUrl: vi.fn(),
  getSignedUrl: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

// Minimal FastifyInstance stub for AuthResolver (only jwt is used)
export const makeFastifyJwt = (): { jwt: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> } } => ({
  jwt: {
    sign: vi.fn().mockReturnValue('signed-token'),
    verify: vi.fn(),
  },
});

// Domain object fixtures
export const makeUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-pw',
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

export const makeDocument = (overrides?: Partial<Document>): Document => ({
  id: 'doc-1',
  applicationId: 'app-1',
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 12345,
  storageKey: 'users/user-1/applications/app-1/resume.pdf',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});
