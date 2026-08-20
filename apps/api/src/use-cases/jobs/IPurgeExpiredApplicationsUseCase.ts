export interface PurgeExpiredApplicationsResult {
  purged: number;
  failed: number;
}

export interface IPurgeExpiredApplicationsUseCase {
  execute(): Promise<PurgeExpiredApplicationsResult>;
}
