export interface ExportedNote {
  content: string;
  createdAt: string;
}

export interface ExportedDocument {
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ExportedPipelineStage {
  key: string;
  name: string;
  color: string;
  position: number;
  category: string;
}

export interface ExportedApplication {
  company: string;
  role: string;
  status: string;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  appliedAt: string | null;
  createdAt: string;
  notes: ExportedNote[];
  documents: ExportedDocument[];
}

export interface ExportUserDataOutput {
  exportedAt: string;
  user: { email: string; createdAt: string };
  pipelineStages?: ExportedPipelineStage[];
  applications: ExportedApplication[];
}

export interface IExportUserDataUseCase {
  execute(userId: string): Promise<ExportUserDataOutput>;
}
