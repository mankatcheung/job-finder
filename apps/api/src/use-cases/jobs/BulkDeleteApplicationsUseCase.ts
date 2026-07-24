import type { IDeleteApplicationUseCase } from '@/use-cases/jobs/IDeleteApplicationUseCase.js';
import { assertValidBulkIds } from '@/use-cases/jobs/bulkValidation.js';
import type {
  IBulkDeleteApplicationsUseCase,
  BulkDeleteApplicationsInput,
} from '@/use-cases/jobs/IBulkDeleteApplicationsUseCase.js';

interface Deps {
  deleteApplicationUseCase: IDeleteApplicationUseCase;
}

export class BulkDeleteApplicationsUseCase implements IBulkDeleteApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: BulkDeleteApplicationsInput): Promise<void> {
    assertValidBulkIds(input.applicationIds);

    await Promise.all(
      input.applicationIds.map((applicationId) =>
        this.deps.deleteApplicationUseCase.execute({ userId: input.userId, applicationId }),
      ),
    );
  }
}
