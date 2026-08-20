import type { Application } from '#src/domain/application/Application.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IListTrashedApplicationsUseCase } from '#src/use-cases/jobs/IListTrashedApplicationsUseCase.js';

interface Deps {
  applicationRepository: IApplicationRepository;
}

/** What is in this user's Trash, most recently deleted first. */
export class ListTrashedApplicationsUseCase implements IListTrashedApplicationsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<Application[]> {
    return this.deps.applicationRepository.findTrashedByUserId(userId);
  }
}
