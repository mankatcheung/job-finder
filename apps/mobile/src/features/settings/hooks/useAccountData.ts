import { useMutation } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { EXPORT_USER_DATA_QUERY, IMPORT_USER_DATA_MUTATION } from '../graphql/operations';
import type { ImportSummary } from '../types';

export function useExportUserData() {
  return useMutation({
    mutationFn: () =>
      gqlRequest<{ exportUserData: string }>(EXPORT_USER_DATA_QUERY).then(
        (data) => data.exportUserData,
      ),
  });
}

export function useImportUserData() {
  return useMutation({
    mutationFn: (data: string) =>
      gqlRequest<{ importUserData: ImportSummary }>(IMPORT_USER_DATA_MUTATION, { data }).then(
        (res) => res.importUserData,
      ),
  });
}
