import { Input } from '@job-finder/ui';

export function Default() {
  return <Input placeholder="you@example.com" defaultValue="jamie@acme.com" />;
}

export function Invalid() {
  return (
    <div className="space-y-1">
      <Input placeholder="you@example.com" defaultValue="not-an-email" invalid />
      <p className="text-xs text-red-600">Invalid email</p>
    </div>
  );
}

export function Disabled() {
  return <Input placeholder="you@example.com" defaultValue="jamie@acme.com" disabled />;
}
