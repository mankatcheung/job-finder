import type { Application } from '#src/domain/application/Application.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

export interface MoveApplicationOnBoardInput {
  userId: string;
  applicationId: string;
  /** The column the card ends up in — may be the one it started in. */
  toStatus: ApplicationStatus;
  /** The destination column in full, in its new order, including applicationId. */
  orderedIds: string[];
}

/** The destination column as it now reads, in order. */
export type MoveApplicationOnBoardOutput = Application[];

export interface IMoveApplicationOnBoardUseCase {
  execute(input: MoveApplicationOnBoardInput): Promise<MoveApplicationOnBoardOutput>;
}
