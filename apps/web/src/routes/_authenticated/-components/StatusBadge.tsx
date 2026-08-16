import { Badge, type BadgeTone } from '@trakwyn/ui';

const STATUS_TONES: Record<string, BadgeTone> = {
  draft: 'gray',
  applied: 'blue',
  interviewing: 'yellow',
  offered: 'green',
  rejected: 'red',
  accepted: 'emerald',
  withdrawn: 'gray',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? 'gray'} className="capitalize">
      {status}
    </Badge>
  );
}
