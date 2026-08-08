import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({ token: z.string().optional() });

const VerifyEmailPage = () =>
  import('./-components/VerifyEmailPage').then((m) => m.VerifyEmailPage);

export const Route = createFileRoute('/verify-email')({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
});
