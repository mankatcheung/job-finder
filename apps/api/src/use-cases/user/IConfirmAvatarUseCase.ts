export interface ConfirmAvatarInput {
  userId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IConfirmAvatarUseCase {
  execute(input: ConfirmAvatarInput): Promise<void>;
}
