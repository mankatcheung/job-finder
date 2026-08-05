import { queryOptions } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';

const ANALYTICS_QUERY = `
  query AnalyticsApplications {
    applications {
      id company role status appliedAt createdAt
    }
    pipelineStages { key name color position category }
  }
`;

export type AnalyticsApplication = {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt?: string | null;
  createdAt: string;
};

// Kept in its own module (no recharts import) so the analytics route's
// loader can prefetch this without pulling the lazy-loaded chart
// component's much heavier dependency into the eagerly-loaded route chunk.
export type AnalyticsPipelineStage = {
  key: string;
  name: string;
  color: string;
  position: number;
  category: string;
};

export const analyticsQueryOptions = queryOptions({
  queryKey: ['analytics'],
  queryFn: () =>
    gqlClient.request<{
      applications: AnalyticsApplication[];
      pipelineStages: AnalyticsPipelineStage[];
    }>(ANALYTICS_QUERY),
});
