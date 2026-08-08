import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ConfirmBackupEmailPage } from './-components/ConfirmBackupEmailPage';

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute('/confirm-backup-email')({
  validateSearch: searchSchema,
  component: ConfirmBackupEmailPage,
});
