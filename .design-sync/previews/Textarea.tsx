import { Textarea } from '@job-finder/ui';

export function Default() {
  return (
    <div className="max-w-sm">
      <Textarea rows={4} placeholder="Job description, notes…" />
    </div>
  );
}

export function Invalid() {
  return (
    <div className="max-w-sm">
      <Textarea rows={3} invalid defaultValue="" placeholder="Required" />
    </div>
  );
}
