import { createFileRoute } from '@tanstack/react-router';

const ForgotPasswordPage = () =>
  import('./-components/ForgotPasswordPage').then((m) => m.ForgotPasswordPage);

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});
