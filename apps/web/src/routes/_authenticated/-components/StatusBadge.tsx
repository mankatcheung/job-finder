import { Badge, type BadgeTone } from '@trakwyn/ui';
import { useLocale } from '#/lib/i18n';

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
  const { t } = useLocale();
  // defaultValue: an unrecognized status (e.g. new data from an API version
  // this build predates) falls back to the raw value instead of leaking the
  // untranslated i18next key ("status.foo") to the user.
  return (
    <Badge tone={STATUS_TONES[status] ?? 'gray'} className="capitalize">
      {t(`status.${status}`, { defaultValue: status })}
    </Badge>
  );
}
