import { z } from 'zod';

export const applicationFormSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum([
    'draft',
    'applied',
    'interviewing',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
  ]),
  jobUrl: z.union([z.string().url('Enter a valid URL'), z.literal('')]),
  location: z.string(),
  salaryRange: z.string(),
  description: z.string(),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const EMPTY_APPLICATION_FORM_VALUES: ApplicationFormValues = {
  company: '',
  role: '',
  status: 'draft',
  jobUrl: '',
  location: '',
  salaryRange: '',
  description: '',
};
