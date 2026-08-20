import type { Application } from '#src/domain/application/Application.js';

export interface IListTrashedApplicationsUseCase {
  execute(userId: string): Promise<Application[]>;
}
