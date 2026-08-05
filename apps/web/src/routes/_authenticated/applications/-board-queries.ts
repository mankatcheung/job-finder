import { queryOptions } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';

const APPLICATIONS_QUERY = `
  query BoardApplications {
    applications {
      id company role status location appliedAt starred createdAt
    }
    pipelineStages { key name color position category }
  }
`;

export type BoardApplication = {
  id: string;
  company: string;
  role: string;
  status: string;
  location?: string | null;
  appliedAt?: string | null;
  starred: boolean;
  createdAt: string;
};

// Kept in its own module (no dnd-kit/component imports) so the board route's
// loader can prefetch this without pulling the lazy-loaded board component's
// heavier dependencies into the eagerly-loaded route chunk.
export const boardApplicationsQueryOptions = queryOptions({
  queryKey: ['applications', null],
  queryFn: () =>
    gqlClient.request<{
      applications: BoardApplication[];
      pipelineStages: Array<{
        key: string;
        name: string;
        color: string;
        position: number;
        category: string;
      }>;
    }>(APPLICATIONS_QUERY),
});
