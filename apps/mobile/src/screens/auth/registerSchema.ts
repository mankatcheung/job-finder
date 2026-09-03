import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
