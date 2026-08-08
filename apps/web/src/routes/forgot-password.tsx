import { createFileRoute } from '@tanstack/react-router';
import { ForgotPasswordPage } from './-components/ForgotPasswordPage';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
});
