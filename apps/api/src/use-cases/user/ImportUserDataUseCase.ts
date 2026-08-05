import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { INoteRepository } from '#src/use-cases/ports/INoteRepository.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';
import { PIPELINE_STAGE_CATEGORIES } from '#src/domain/pipelineStage/PipelineStage.js';
import type { IPipelineStageRepository } from '#src/use-cases/ports/IPipelineStageRepository.js';
import { ERROR_CODES, DEFAULTS } from '#src/constants.js';
import type {
  IImportUserDataUseCase,
  ImportSummary,
} from '#src/use-cases/user/IImportUserDataUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  noteRepository: INoteRepository;
  generateId: () => string;
  pipelineStageRepository?: IPipelineStageRepository;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asStatus(value: unknown): ApplicationStatus {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : DEFAULTS.APPLICATION_STATUS;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class ImportUserDataUseCase implements IImportUserDataUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string, rawData: string): Promise<ImportSummary> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      throw Object.assign(new Error('Import file is not valid JSON'), {
        code: ERROR_CODES.VALIDATION,
      });
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.applications)) {
      throw Object.assign(
        new Error('Import file must contain an "applications" array — export your data first'),
        { code: ERROR_CODES.VALIDATION },
      );
    }

    const summary: ImportSummary = {
      applicationsImported: 0,
      applicationsSkipped: 0,
      notesImported: 0,
      documentsSkipped: 0,
    };

    if (this.deps.pipelineStageRepository && Array.isArray(parsed.pipelineStages)) {
      const existing = await this.deps.pipelineStageRepository.findAllByUserId(userId);
      const existingKeys = new Set(existing.map((stage) => stage.key));
      for (const stage of parsed.pipelineStages) {
        if (
          !isRecord(stage) ||
          typeof stage.key !== 'string' ||
          typeof stage.name !== 'string' ||
          existingKeys.has(stage.key)
        )
          continue;
        const category = PIPELINE_STAGE_CATEGORIES.includes(stage.category as never)
          ? (stage.category as (typeof PIPELINE_STAGE_CATEGORIES)[number])
          : 'active';
        await this.deps.pipelineStageRepository.create({
          id: this.deps.generateId(),
          userId,
          key: stage.key,
          name: stage.name,
          color: typeof stage.color === 'string' ? stage.color : 'gray',
          position: typeof stage.position === 'number' ? stage.position : existing.length,
          category,
        });
        existingKeys.add(stage.key);
      }
    }

    for (const entry of parsed.applications) {
      if (!isRecord(entry) || typeof entry.company !== 'string' || typeof entry.role !== 'string') {
        summary.applicationsSkipped++;
        continue;
      }
      if (entry.company.trim().length === 0 || entry.role.trim().length === 0) {
        summary.applicationsSkipped++;
        continue;
      }

      const app = await this.deps.applicationRepository.create({
        id: this.deps.generateId(),
        userId,
        company: entry.company,
        role: entry.role,
        status: asStatus(entry.status),
        jobUrl: asNullableString(entry.jobUrl),
        location: asNullableString(entry.location),
        salaryRange: asNullableString(entry.salaryRange),
        description: asNullableString(entry.description),
      });

      const appliedAt = asDate(entry.appliedAt);
      if (appliedAt) {
        await this.deps.applicationRepository.update(app.id, { appliedAt });
      }

      summary.applicationsImported++;

      if (Array.isArray(entry.notes)) {
        for (const note of entry.notes) {
          if (
            isRecord(note) &&
            typeof note.content === 'string' &&
            note.content.trim().length > 0
          ) {
            await this.deps.noteRepository.create({
              id: this.deps.generateId(),
              applicationId: app.id,
              content: note.content,
            });
            summary.notesImported++;
          }
        }
      }

      if (Array.isArray(entry.documents)) {
        // Exported document metadata has no storageKey — there's no file content to
        // restore, so we can only report how many were left out rather than recreate
        // broken records that point at nothing.
        summary.documentsSkipped += entry.documents.length;
      }
    }

    return summary;
  }
}
