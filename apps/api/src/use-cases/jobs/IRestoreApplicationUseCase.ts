export interface RestoreApplicationInput {
  userId: string;
  applicationId: string;
}

export interface IRestoreApplicationUseCase {
  execute(input: RestoreApplicationInput): Promise<void>;
}
