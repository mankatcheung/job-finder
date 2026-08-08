import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({ token: z.string().optional() });

const ResetPasswordPage = () =>
  import('./-components/ResetPasswordPage').then((m) => m.ResetPasswordPage);

export const Route = createFileRoute('/reset-password')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});
