import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';

const APPLICATION_STATUSES = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'accepted',
  'withdrawn',
] as const;

const schema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(APPLICATION_STATUSES),
  jobUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const APPLICATION_QUERY = `
  query Application($id: ID!) {
    application(id: $id) {
      id company role status jobUrl location salaryRange description appliedAt createdAt updatedAt
    }
  }
`;
const UPDATE_MUTATION = `
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) { id }
  }
`;

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
};

export const Route = createFileRoute('/_authenticated/applications/$applicationId/edit')({
  component: EditApplicationPage,
});

export function EditApplicationPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () =>
      gqlClient.request<{ application: Application }>(APPLICATION_QUERY, { id: applicationId }),
  });

  const app = data?.application;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: app
      ? {
          company: app.company,
          role: app.role,
          status: app.status as (typeof APPLICATION_STATUSES)[number],
          jobUrl: app.jobUrl ?? '',
          location: app.location ?? '',
          salaryRange: app.salaryRange ?? '',
          description: app.description ?? '',
        }
      : undefined,
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const input = {
        company: data.company,
        role: data.role,
        status: data.status,
        ...(data.jobUrl ? { jobUrl: data.jobUrl } : {}),
        ...(data.location ? { location: data.location } : {}),
        ...(data.salaryRange ? { salaryRange: data.salaryRange } : {}),
        ...(data.description ? { description: data.description } : {}),
      };
      await gqlClient.request(UPDATE_MUTATION, { id: applicationId, input });
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      await navigate({ to: '/applications/$applicationId', params: { applicationId } });
    } catch {
      setError('root', { message: 'Failed to update application. Please try again.' });
    }
  };

  if (!app)
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <a
          href={`/applications/${applicationId}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back
        </a>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          Edit application
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company *" error={errors.company?.message}>
            <input {...register('company')} className={inputClass} />
          </Field>
          <Field label="Role *" error={errors.role?.message}>
            <input {...register('role')} className={inputClass} />
          </Field>
        </div>

        <Field label="Status">
          <select {...register('status')} className={inputClass}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Job URL" error={errors.jobUrl?.message}>
          <input {...register('jobUrl')} className={inputClass} type="url" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location">
            <input {...register('location')} className={inputClass} />
          </Field>
          <Field label="Salary range">
            <input {...register('salaryRange')} className={inputClass} />
          </Field>
        </div>

        <Field label="Description / Notes">
          <textarea {...register('description')} className={`${inputClass} h-28 resize-none`} />
        </Field>

        {errors.root && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {errors.root.message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
          <a
            href={`/applications/${applicationId}`}
            className="px-5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
