import { useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { getErrorMessage } from '#/lib/errors';
import { StarIcon, XIcon } from 'lucide-react';
import { Button, Input, Select } from '@job-finder/ui';
import { JdImportPanel } from '../../-components/JdImportPanel';
import { applicationQueryOptions } from '../-application-query';
import { Route } from '../edit';

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
  source: z.string().optional(),
  followUpAt: z.string().optional(),
  starred: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const UPDATE_MUTATION = `
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) { id }
  }
`;

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

export function EditApplicationPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { data } = useQuery(applicationQueryOptions(applicationId));

  const app = data?.application;

  useEffect(() => {
    if (app?.tags) setTags(app.tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.tags?.join(',')]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
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
          source: app.source ?? '',
          followUpAt: app.followUpAt ? app.followUpAt.slice(0, 10) : '',
          starred: app.starred,
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
        ...(data.source ? { source: data.source } : { source: null }),
        ...(data.followUpAt ? { followUpAt: data.followUpAt } : { followUpAt: null }),
        starred: data.starred ?? false,
        tags,
      };
      await gqlClient.request(UPDATE_MUTATION, { id: applicationId, input });
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      await navigate({ to: '/applications/$applicationId', params: { applicationId } });
    } catch (err) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  if (!app)
    return (
      <div className="p-4 sm:p-8">
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
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

      <JdImportPanel
        onFill={(parsed) => {
          if (parsed.company) setValue('company', parsed.company);
          if (parsed.role) setValue('role', parsed.role);
          if (parsed.location) setValue('location', parsed.location);
          if (parsed.salary) setValue('salaryRange', parsed.salary);
          if (parsed.description) setValue('description', parsed.description);
        }}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company *" error={errors.company?.message}>
            <Input {...register('company')} invalid={!!errors.company} />
          </Field>
          <Field label="Role *" error={errors.role?.message}>
            <Input {...register('role')} invalid={!!errors.role} />
          </Field>
        </div>

        <Field label="Status">
          <Select {...register('status')}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Job URL" error={errors.jobUrl?.message}>
          <Input {...register('jobUrl')} invalid={!!errors.jobUrl} type="url" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location">
            <Input {...register('location')} />
          </Field>
          <Field label="Salary range">
            <Input {...register('salaryRange')} />
          </Field>
        </div>

        <Field label="Description / Notes">
          <textarea {...register('description')} className={`${inputClass} h-28 resize-none`} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Source">
            <Input {...register('source')} placeholder="LinkedIn, referral, Indeed…" />
          </Field>
          <Field label="Follow-up date">
            <Input {...register('followUpAt')} type="date" />
          </Field>
        </div>

        <Field label="Tags">
          <div className="space-y-2">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="hover:text-blue-600 dark:hover:text-blue-200"
                    >
                      <XIcon size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const val = tagInput.trim().toLowerCase();
                  if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
                  setTagInput('');
                }
              }}
              placeholder="Type a tag and press Enter…"
            />
          </div>
        </Field>

        <div className="flex items-center gap-3">
          <input
            {...register('starred')}
            id="starred-edit"
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
          />
          <label
            htmlFor="starred-edit"
            className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
          >
            <StarIcon size={14} className="text-yellow-400" /> Star this application
          </label>
        </div>

        {errors.root && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {errors.root.message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
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
