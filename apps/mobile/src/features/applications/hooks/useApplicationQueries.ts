import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  APPLICATIONS_QUERY,
  APPLICATION_QUERY,
  TRASHED_APPLICATIONS_QUERY,
} from '../graphql/operations';
import type { Application, ApplicationStatus } from '../types';

export const applicationsQueryKey = (status?: ApplicationStatus) =>
  ['applications', status ?? 'all'] as const;
export const applicationQueryKey = (id: string) => ['applications', 'detail', id] as const;
export const trashedApplicationsQueryKey = ['applications', 'trash'] as const;

export function useApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: applicationsQueryKey(status),
    queryFn: () =>
      gqlRequest<{ applications: Application[] }>(APPLICATIONS_QUERY, {
        status: status ?? null,
      }).then((data) => data.applications),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationQueryKey(id),
    queryFn: () =>
      gqlRequest<{ application: Application }>(APPLICATION_QUERY, { id }).then(
        (data) => data.application,
      ),
    enabled: Boolean(id),
  });
}

export function useTrashedApplications() {
  return useQuery({
    queryKey: trashedApplicationsQueryKey,
    queryFn: () =>
      gqlRequest<{ trashedApplications: Application[] }>(TRASHED_APPLICATIONS_QUERY).then(
        (data) => data.trashedApplications,
      ),
  });
}
