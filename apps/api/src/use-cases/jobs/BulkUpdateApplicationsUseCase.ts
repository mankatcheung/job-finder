import type { IUpdateApplicationUseCase } from '@/use-cases/jobs/IUpdateApplicationUseCase.js';
import type { ITransactionManager } from '@/use-cases/ports/ITransactionManager.js';
import { assertValidBulkIds } from '@/use-cases/jobs/bulkValidation.js';
import type {
  IBulkUpdateApplicationsUseCase,
  BulkUpdateApplicationsInput,
  BulkUpdateApplicationsOutput,
} from '@/use-cases/jobs/IBulkUpdateApplicationsUseCase.js';

interface Deps {
  updateApplicationUseCase: IUpdateApplicationUseCase;
  transactionManager?: ITransactionManager;
}

export class BulkUpdateApplicationsUseCase implements IBulkUpdateApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: BulkUpdateApplicationsInput): Promise<BulkUpdateApplicationsOutput> {
    assertValidBulkIds(input.applicationIds);

    const run = () =>
      Promise.all(
        input.applicationIds.map((applicationId) =>
          this.deps.updateApplicationUseCase.execute({
            userId: input.userId,
            applicationId,
            status: input.status,
            starred: input.starred,
          }),
        ),
      );

    return this.deps.transactionManager ? this.deps.transactionManager.run(run) : run();
  }
}
