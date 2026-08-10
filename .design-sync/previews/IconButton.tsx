import { IconButton } from '@job-finder/ui';
import { XIcon, ExternalLinkIcon, TrashIcon } from 'lucide-react';

export function Default() {
  return <IconButton label="Close" icon={<XIcon size={16} />} />;
}

export function Variants() {
  return (
    <div className="flex items-center gap-3">
      <IconButton label="Open in new tab" icon={<ExternalLinkIcon size={16} />} />
      <IconButton label="Delete" icon={<TrashIcon size={16} />} variant="danger" />
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <IconButton label="Close" icon={<XIcon size={20} />} size="md" />
      <IconButton label="Close" icon={<XIcon size={16} />} size="sm" />
    </div>
  );
}

export function Disabled() {
  return <IconButton label="Delete" icon={<TrashIcon size={16} />} variant="danger" disabled />;
}
