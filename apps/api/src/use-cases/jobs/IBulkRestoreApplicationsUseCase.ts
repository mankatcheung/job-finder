export interface BulkRestoreApplicationsInput {
  userId: string;
  applicationIds: string[];
}

export interface BulkRestoreApplicationsResult {
  /**
   * How many applications actually moved out of Trash. Lower than the batch
   * size when some of the ids were already restored — reporting the batch size
   * would claim work that did not happen.
   */
  restored: number;
}

export interface IBulkRestoreApplicationsUseCase {
  execute(input: BulkRestoreApplicationsInput): Promise<BulkRestoreApplicationsResult>;
}
