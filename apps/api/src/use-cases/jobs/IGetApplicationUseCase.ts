import type { Application } from '@/domain/application/Application.js';

export interface GetApplicationInput {
  userId: string;
  applicationId: string;
}

export type GetApplicationOutput = Application;

export interface IGetApplicationUseCase {
  execute(input: GetApplicationInput): Promise<GetApplicationOutput>;
}
