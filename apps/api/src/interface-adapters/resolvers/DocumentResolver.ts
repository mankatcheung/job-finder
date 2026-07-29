import type { IRequestUploadUrlUseCase } from '#src/use-cases/documents/IRequestUploadUrlUseCase.js';
import type { IConfirmDocumentUseCase } from '#src/use-cases/documents/IConfirmDocumentUseCase.js';
import type { IGetDocumentsUseCase } from '#src/use-cases/documents/IGetDocumentsUseCase.js';
import type { IDeleteDocumentUseCase } from '#src/use-cases/documents/IDeleteDocumentUseCase.js';
import type {
  DocumentMapper,
  DocumentDTO,
} from '#src/interface-adapters/mappers/DocumentMapper.js';
import type { IHttpRequest } from '#src/http/ports/IHttpRequest.js';

interface Deps {
  requestUploadUrlUseCase: IRequestUploadUrlUseCase;
  confirmDocumentUseCase: IConfirmDocumentUseCase;
  getDocumentsUseCase: IGetDocumentsUseCase;
  deleteDocumentUseCase: IDeleteDocumentUseCase;
  documentMapper: DocumentMapper;
  /**
   * Fallback origin used when the incoming request has no `Host` header
   * (e.g. unset during some unit-test scenarios). Normally the request's
   * own `Host` wins, but we never want a malformed `https:///files/:key`
   * URL to leak into a GraphQL response.
   */
  apiOrigin: string;
}

interface UploadUrlPayload {
  uploadUrl: string;
  storageKey: string;
}

interface ConfirmInput {
  applicationId: string;
  storageKey: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  documentType?: string;
  version?: string | null;
}

/**
 * Documents are stored as private blobs, so we never expose the underlying
 * storage URL to clients — instead we hand back the API's authenticated
 * `/files/:key` endpoint, which streams the body after authenticating the
 * caller and verifying the embedded `users/:userId` segment matches the
 * JWT subject. Built per request so `Host` matches whatever the GraphQL
 * client actually hit (works across web app + browser extension origins).
 * Falls back to `webAppOrigin` if the request lacks a usable Host header.
 */
function proxiedFileUrl(request: IHttpRequest, storageKey: string, fallbackOrigin: string): string {
  const rawHost = request.headers.host;
  const host = Array.isArray(rawHost) ? rawHost[0] : (rawHost ?? '');
  const base = host ? `${request.protocol}://${host}` : fallbackOrigin;
  return `${base}/files/${storageKey}`;
}

export class DocumentResolver {
  constructor(private readonly deps: Deps) {}

  async getDocuments(
    userId: string,
    applicationId: string,
    request: IHttpRequest,
  ): Promise<DocumentDTO[]> {
    const docs = await this.deps.getDocumentsUseCase.execute({ userId, applicationId });
    return docs.map((doc) => {
      const url = proxiedFileUrl(request, doc.storageKey, this.deps.apiOrigin);
      return this.deps.documentMapper.toDTO(doc, url);
    });
  }

  async requestUploadUrl(
    userId: string,
    applicationId: string,
    filename: string,
    mimeType: string,
  ): Promise<UploadUrlPayload> {
    return this.deps.requestUploadUrlUseCase.execute({
      userId,
      applicationId,
      filename,
      mimeType,
    });
  }

  async confirmDocument(
    userId: string,
    input: ConfirmInput,
    request: IHttpRequest,
  ): Promise<DocumentDTO> {
    const doc = await this.deps.confirmDocumentUseCase.execute({ userId, ...input });
    const url = proxiedFileUrl(request, doc.storageKey, this.deps.apiOrigin);
    return this.deps.documentMapper.toDTO(doc, url);
  }

  async deleteDocument(userId: string, documentId: string): Promise<boolean> {
    await this.deps.deleteDocumentUseCase.execute({ userId, documentId });
    return true;
  }
}
