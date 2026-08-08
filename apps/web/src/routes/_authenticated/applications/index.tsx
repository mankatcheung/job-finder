import { createFileRoute } from '@tanstack/react-router';
import { infiniteQueryOptions } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { z } from 'zod';
import { lazy } from 'react';
import type { ApplicationStatus } from '#/graphql/generated/graphql';

const ApplicationsPage = lazy(() =>
  import('./-components/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })),
);

const PAGE_SIZE = 20;

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

const searchSchema = z.object({ status: z.string().optional(), starred: z.boolean().optional() });

export const APPLICATIONS_PAGE_QUERY = `
  query ApplicationsPage(
    $status: ApplicationStatus
    $starred: Boolean
    $search: String
    $cursor: String
    $limit: Int
  ) {
    applicationsPage(
      status: $status
      starred: $starred
      search: $search
      cursor: $cursor
      limit: $limit
    ) {
      hasNextPage
      nextCursor
      items {
        id
        company
        role
        status
        location
        description
        appliedAt
        starred
        source
        followUpAt
        tags
        createdAt
      }
    }
  }
`;

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  location?: string | null;
  description?: string | null;
  appliedAt?: string | null;
  starred: boolean;
  source?: string | null;
  followUpAt?: string | null;
  tags: string[];
  createdAt: string;
};

export type ApplicationsPageResult = {
  applicationsPage: {
    items: Application[];
    hasNextPage: boolean;
    nextCursor: string | null;
  };
};

export { PAGE_SIZE, APPLICATION_STATUSES };

export function applicationsPageQueryOptions(
  status: string | undefined,
  starred: boolean | undefined,
  searchTerm: string,
) {
  return infiniteQueryOptions({
    queryKey: ['applications', 'page', status ?? null, starred ?? false, searchTerm],
    queryFn: ({ pageParam }) =>
      gqlClient.request<ApplicationsPageResult>(APPLICATIONS_PAGE_QUERY, {
        status: status ?? null,
        starred: starred ?? null,
        search: searchTerm || null,
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.applicationsPage.hasNextPage ? lastPage.applicationsPage.nextCursor : undefined,
  });
}

export const Route = createFileRoute('/_authenticated/applications/')({
  validateSearch: searchSchema,
  // searchTerm is local-only component state (always '' on a fresh navigation),
  // so only status/starred — the URL-driven filters — need to be loader deps.
  loaderDeps: ({ search }) => ({ status: search.status, starred: search.starred }),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureInfiniteQueryData(
      applicationsPageQueryOptions(deps.status, deps.starred, ''),
    ),
  component: ApplicationsPage,
});
