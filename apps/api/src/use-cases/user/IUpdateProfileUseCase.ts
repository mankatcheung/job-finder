export interface UpdateProfileInput {
  userId: string;
  name?: string | null;
  timezone?: string | null;
  targetRole?: string | null;
  customAiPrompt?: string | null;
}

export interface IUpdateProfileUseCase {
  execute(input: UpdateProfileInput): Promise<void>;
}
