export interface JobPostingSource {
  text?: string | null;
  url?: string | null;
}

export interface IJobPostingSourceResolver {
  resolve(source: JobPostingSource): Promise<string>;
}
