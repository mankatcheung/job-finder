import { Button } from '@job-finder/ui';

export function Default() {
  return <Button>Sign in</Button>;
}

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <Button size="md">Continue</Button>
      <Button size="sm">Continue</Button>
    </div>
  );
}

export function Disabled() {
  return (
    <div className="flex items-center gap-3">
      <Button disabled>Signing in…</Button>
      <Button variant="secondary" disabled>
        Cancel
      </Button>
    </div>
  );
}

export function FullWidth() {
  return (
    <div className="w-64">
      <Button fullWidth>Sign in</Button>
    </div>
  );
}
