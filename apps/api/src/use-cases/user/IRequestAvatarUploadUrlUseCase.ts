export interface RequestAvatarUploadUrlInput {
  userId: string;
  filename: string;
  mimeType: string;
}

export interface RequestAvatarUploadUrlOutput {
  uploadUrl: string;
  storageKey: string;
}

export interface IRequestAvatarUploadUrlUseCase {
  execute(input: RequestAvatarUploadUrlInput): Promise<RequestAvatarUploadUrlOutput>;
}
