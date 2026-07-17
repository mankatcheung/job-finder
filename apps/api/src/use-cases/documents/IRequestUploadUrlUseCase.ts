export interface RequestUploadUrlInput {
  userId: string;
  applicationId: string;
  filename: string;
  mimeType: string;
}

export interface RequestUploadUrlOutput {
  uploadUrl: string;
  storageKey: string;
}

export interface IRequestUploadUrlUseCase {
  execute(input: RequestUploadUrlInput): Promise<RequestUploadUrlOutput>;
}
