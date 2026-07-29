import { describe, it, expect, vi } from 'vitest';
import { DocumentResolver } from '#src/interface-adapters/resolvers/DocumentResolver.js';
import { DocumentMapper } from '#src/interface-adapters/mappers/DocumentMapper.js';
import { makeDocument } from '#src/__tests__/helpers/mocks.js';
import type { IRequestUploadUrlUseCase } from '#src/use-cases/documents/IRequestUploadUrlUseCase.js';
import type { IConfirmDocumentUseCase } from '#src/use-cases/documents/IConfirmDocumentUseCase.js';
import type { IGetDocumentsUseCase } from '#src/use-cases/documents/IGetDocumentsUseCase.js';
import type { IDeleteDocumentUseCase } from '#src/use-cases/documents/IDeleteDocumentUseCase.js';
import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const fakeRequest = (overrides?: Partial<IHttpRequest>): IHttpRequest => ({
  method: 'GET',
  path: '/graphql',
  headers: { host: 'api.example.com' },
  cookies: {},
  params: {},
  query: {},
  body: null,
  ip: '127.0.0.1',
  protocol: 'https',
  ...overrides,
});

const makeDeps = (overrides?: object) => ({
  requestUploadUrlUseCase: stub<IRequestUploadUrlUseCase>({ execute: vi.fn() }),
  confirmDocumentUseCase: stub<IConfirmDocumentUseCase>({ execute: vi.fn() }),
  getDocumentsUseCase: stub<IGetDocumentsUseCase>({ execute: vi.fn() }),
  deleteDocumentUseCase: stub<IDeleteDocumentUseCase>({ execute: vi.fn() }),
  documentMapper: new DocumentMapper(),
  apiOrigin: 'https://api.fallback.example.com',
  ...overrides,
});

describe('DocumentResolver', () => {
  it('getDocuments: returns proxied /files/:key URLs (no signing round-trip since documents are private)', async () => {
    const docs = [
      makeDocument({ id: 'doc-1', storageKey: 'users/user-1/applications/app-1/d1.pdf' }),
      makeDocument({ id: 'doc-2', storageKey: 'users/user-1/applications/app-1/d2.pdf' }),
    ];
    const deps = makeDeps({
      getDocumentsUseCase: stub<IGetDocumentsUseCase>({ execute: vi.fn().mockResolvedValue(docs) }),
    });

    const resolver = new DocumentResolver(deps);
    const result = await resolver.getDocuments('user-1', 'app-1', fakeRequest());

    expect(deps.getDocumentsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe(
      'https://api.example.com/files/users/user-1/applications/app-1/d1.pdf',
    );
    expect(result[1].url).toBe(
      'https://api.example.com/files/users/user-1/applications/app-1/d2.pdf',
    );
  });

  it('getDocuments: uses request protocol/host when host header is an array', async () => {
    const doc = makeDocument({ storageKey: 'users/user-1/applications/app-1/x.pdf' });
    const deps = makeDeps({
      getDocumentsUseCase: stub<IGetDocumentsUseCase>({
        execute: vi.fn().mockResolvedValue([doc]),
      }),
    });
    const resolver = new DocumentResolver(deps);

    const result = await resolver.getDocuments(
      'user-1',
      'app-1',
      fakeRequest({ headers: { host: ['api.example.com', 'mirror.example.com'] } }),
    );

    expect(result[0].url).toBe('https://api.example.com/files/' + doc.storageKey);
  });

  it('getDocuments: falls back to apiOrigin when host header is missing/empty', async () => {
    const doc = makeDocument({ storageKey: 'users/user-1/applications/app-1/y.pdf' });
    const deps = makeDeps({
      apiOrigin: 'https://fallback.example.com',
      getDocumentsUseCase: stub<IGetDocumentsUseCase>({
        execute: vi.fn().mockResolvedValue([doc]),
      }),
    });
    const resolver = new DocumentResolver(deps);

    const result = await resolver.getDocuments('user-1', 'app-1', fakeRequest({ headers: {} }));

    expect(result[0].url).toBe('https://fallback.example.com/files/' + doc.storageKey);
  });

  it('requestUploadUrl: delegates to use case and returns the payload', async () => {
    const payload = {
      uploadUrl: 'https://r2.example.com/upload',
      storageKey: 'users/user-1/applications/app-1/abc-resume.pdf',
    };
    const deps = makeDeps({
      requestUploadUrlUseCase: stub<IRequestUploadUrlUseCase>({
        execute: vi.fn().mockResolvedValue(payload),
      }),
    });

    const resolver = new DocumentResolver(deps);
    const result = await resolver.requestUploadUrl(
      'user-1',
      'app-1',
      'resume.pdf',
      'application/pdf',
    );

    expect(deps.requestUploadUrlUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
      filename: 'resume.pdf',
      mimeType: 'application/pdf',
    });
    expect(result).toEqual(payload);
  });

  it('confirmDocument: maps the saved doc with a proxied URL', async () => {
    const doc = makeDocument({ storageKey: 'users/user-1/applications/app-1/abc-resume.pdf' });
    const deps = makeDeps({
      confirmDocumentUseCase: stub<IConfirmDocumentUseCase>({
        execute: vi.fn().mockResolvedValue(doc),
      }),
    });

    const resolver = new DocumentResolver(deps);
    const result = await resolver.confirmDocument(
      'user-1',
      {
        applicationId: 'app-1',
        storageKey: doc.storageKey,
        name: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 12345,
      },
      fakeRequest(),
    );

    expect(result.url).toBe(
      'https://api.example.com/files/users/user-1/applications/app-1/abc-resume.pdf',
    );
    expect(result.id).toBe(doc.id);
  });

  it('deleteDocument: calls delete use case and returns true', async () => {
    const deps = makeDeps({
      deleteDocumentUseCase: stub<IDeleteDocumentUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new DocumentResolver(deps);
    const result = await resolver.deleteDocument('user-1', 'doc-1');

    expect(deps.deleteDocumentUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      documentId: 'doc-1',
    });
    expect(result).toBe(true);
  });
});
