import { Alert } from '@job-finder/ui';

export function Error() {
  return <Alert>Invalid email or password.</Alert>;
}

export function Success() {
  return (
    <Alert tone="success">
      If an account exists for that email, we&apos;ve sent a recovery link. Check your inbox.
    </Alert>
  );
}
