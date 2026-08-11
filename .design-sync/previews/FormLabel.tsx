import { FormLabel, Input } from '@job-finder/ui';

export function Default() {
  return (
    <div className="max-w-sm">
      <FormLabel htmlFor="email">Email</FormLabel>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  );
}

export function Compact() {
  return (
    <div className="max-w-sm">
      <FormLabel size="xs">Name *</FormLabel>
      <Input placeholder="Jane Smith" />
    </div>
  );
}
