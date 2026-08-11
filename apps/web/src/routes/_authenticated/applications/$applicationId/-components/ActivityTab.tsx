import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { Card } from '@job-finder/ui';

const ACTIVITY_LOGS_QUERY = `
  query ActivityLogs($applicationId: ID!) {
    activityLogs(applicationId: $applicationId) {
      id eventType payload createdAt
    }
  }
`;

type ActivityLog = {
  id: string;
  eventType: string;
  payload: string;
  createdAt: string;
};

const EVENT_LABELS: Record<string, string> = {
  status_changed: 'Status changed',
  note_added: 'Note added',
  note_deleted: 'Note deleted',
  document_uploaded: 'Document uploaded',
  document_deleted: 'Document deleted',
  interview_added: 'Interview round added',
  field_updated: 'Fields updated',
};

const EVENT_ICONS: Record<string, string> = {
  status_changed: '🔄',
  note_added: '📝',
  note_deleted: '🗑️',
  document_uploaded: '📎',
  document_deleted: '🗑️',
  interview_added: '🎙️',
  field_updated: '✏️',
};

function formatActivityPayload(eventType: string, payloadStr: string): string {
  try {
    const p = JSON.parse(payloadStr);
    if (eventType === 'status_changed') return `${p.from} → ${p.to}`;
    if (eventType === 'field_updated' && Array.isArray(p.fields)) return p.fields.join(', ');
  } catch {
    // ignore parse errors
  }
  return '';
}

export function ActivityTab({ applicationId }: { applicationId: string }) {
  const { data } = useQuery({
    queryKey: ['activityLogs', applicationId],
    queryFn: () =>
      gqlClient.request<{ activityLogs: ActivityLog[] }>(ACTIVITY_LOGS_QUERY, { applicationId }),
  });

  const logs = data?.activityLogs ?? [];

  return (
    <div className="space-y-3">
      {logs.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">No activity yet.</p>
      )}
      {logs.map((log) => {
        const detail = formatActivityPayload(log.eventType, log.payload);
        return (
          <Card key={log.id} className="flex items-start gap-3 p-3">
            <span className="text-lg leading-none mt-0.5">{EVENT_ICONS[log.eventType] ?? '•'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {EVENT_LABELS[log.eventType] ?? log.eventType}
                {detail && <span className="font-normal text-gray-500 ml-1">— {detail}</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
