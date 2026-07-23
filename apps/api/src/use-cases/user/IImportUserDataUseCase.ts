export interface ImportSummary {
  applicationsImported: number;
  applicationsSkipped: number;
  notesImported: number;
  documentsSkipped: number;
}

export interface IImportUserDataUseCase {
  execute(userId: string, rawData: string): Promise<ImportSummary>;
}
