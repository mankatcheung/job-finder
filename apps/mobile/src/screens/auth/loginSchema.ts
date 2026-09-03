import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const totpSchema = z.object({
  code: z
    .string()
    .min(6, 'Enter your 6-digit code or a backup code')
    .max(20, 'Enter your 6-digit code or a backup code'),
});

export type TotpFormValues = z.infer<typeof totpSchema>;
