import type { Application } from '#src/domain/application/Application.js';

export interface GetApplicationInput {
  userId: string;
  applicationId: string;
  /**
   * Read past the soft-delete filter so a trashed application resolves instead
   * of reporting as missing. Only the GraphQL `application(id)` query sets this
   * — it backs the read-only Trash preview, where landing on a stale link
   * should explain "this is in Trash" rather than 404. Every other caller (MCP
   * tools, the chat assistant) leaves it off and stays on the filtered read.
   */
  includeTrashed?: boolean;
}

export type GetApplicationOutput = Application;

export interface IGetApplicationUseCase {
  execute(input: GetApplicationInput): Promise<GetApplicationOutput>;
}
