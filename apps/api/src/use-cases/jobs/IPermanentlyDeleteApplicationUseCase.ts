export interface PermanentlyDeleteApplicationInput {
  userId: string;
  applicationId: string;
}

export interface IPermanentlyDeleteApplicationUseCase {
  execute(input: PermanentlyDeleteApplicationInput): Promise<void>;
}
