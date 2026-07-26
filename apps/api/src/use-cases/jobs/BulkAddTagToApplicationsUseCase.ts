import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IUpdateApplicationUseCase } from '#src/use-cases/jobs/IUpdateApplicationUseCase.js';
import type { ITransactionManager } from '#src/use-cases/ports/ITransactionManager.js';
import { ERROR_CODES } from '#src/constants.js';
import { assertValidBulkIds } from '#src/use-cases/jobs/bulkValidation.js';
import type {
  IBulkAddTagToApplicationsUseCase,
  BulkAddTagToApplicationsInput,
  BulkAddTagToApplicationsOutput,
} from '#src/use-cases/jobs/IBulkAddTagToApplicationsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
  updateApplicationUseCase: IUpdateApplicationUseCase;
  transactionManager?: ITransactionManager;
}

export class BulkAddTagToApplicationsUseCase implements IBulkAddTagToApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: BulkAddTagToApplicationsInput): Promise<BulkAddTagToApplicationsOutput> {
    assertValidBulkIds(input.applicationIds);

    const run = () =>
      Promise.all(
        input.applicationIds.map(async (applicationId) => {
          const app = await this.deps.applicationRepository.findById(applicationId);
          if (!app) {
            throw Object.assign(new Error('Application not found'), {
              code: ERROR_CODES.NOT_FOUND,
            });
          }
          if (app.userId !== input.userId) {
            throw Object.assign(new Error('Forbidden'), { code: ERROR_CODES.FORBIDDEN });
          }

          const tags = app.tags.includes(input.tag) ? app.tags : [...app.tags, input.tag];
          return this.deps.updateApplicationUseCase.execute({
            userId: input.userId,
            applicationId,
            tags,
          });
        }),
      );

    return this.deps.transactionManager ? this.deps.transactionManager.run(run) : run();
  }
}
