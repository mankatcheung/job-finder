import { Badge } from '@job-finder/ui';

export function Default() {
  return <Badge tone="blue">applied</Badge>;
}

export function AllTones() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="gray">draft</Badge>
      <Badge tone="blue">applied</Badge>
      <Badge tone="yellow">interviewing</Badge>
      <Badge tone="green">offered</Badge>
      <Badge tone="red">rejected</Badge>
      <Badge tone="emerald">accepted</Badge>
    </div>
  );
}
