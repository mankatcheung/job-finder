export interface BulkDeleteApplicationsInput {
  userId: string;
  applicationIds: string[];
}

export interface IBulkDeleteApplicationsUseCase {
  execute(input: BulkDeleteApplicationsInput): Promise<void>;
}
