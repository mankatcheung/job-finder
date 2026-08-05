import { queryOptions } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';

const APPLICATION_QUERY = `
  query Application($id: ID!) {
    application(id: $id) {
       id company role status jobUrl location salaryRange description appliedAt starred source followUpAt tags createdAt updatedAt
    }
    pipelineStages { key name }
  }
`;

export type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
  appliedAt?: string | null;
  starred: boolean;
  source?: string | null;
  followUpAt?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pipelineStages?: Array<{ key: string; name: string }>;
};

// Shared between the detail page and edit page — both fetch the exact same
// application by id, so a single query definition keeps their cache entries
// (and the route loaders that prefetch them) in sync.
export const applicationQueryOptions = (applicationId: string) =>
  queryOptions({
    queryKey: ['application', applicationId],
    queryFn: () =>
      gqlClient.request<{
        application: Application;
        pipelineStages: Array<{ key: string; name: string }>;
      }>(APPLICATION_QUERY, { id: applicationId }),
  });
