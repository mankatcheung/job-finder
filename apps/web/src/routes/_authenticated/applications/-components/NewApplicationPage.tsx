import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { getErrorMessage } from '#/lib/errors';
import { StarIcon, XIcon } from 'lucide-react';
import { JdImportPanel } from './JdImportPanel';

const schema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  jobUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  followUpAt: z.string().optional(),
  starred: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const CREATE_MUTATION = `
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) { id }
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

export function NewApplicationPage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const input = {
        company: data.company,
        role: data.role,
        ...(data.jobUrl ? { jobUrl: data.jobUrl } : {}),
        ...(data.location ? { location: data.location } : {}),
        ...(data.salaryRange ? { salaryRange: data.salaryRange } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.source ? { source: data.source } : {}),
        ...(data.followUpAt ? { followUpAt: data.followUpAt } : {}),
        starred: data.starred ?? false,
        tags,
      };
      const result = await gqlClient.request<{ createApplication: { id: string } }>(
        CREATE_MUTATION,
        { input },
      );
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await navigate({
        to: '/applications/$applicationId',
        params: { applicationId: result.createApplication.id },
      });
    } catch (err) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <a
          href="/applications"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Applications
        </a>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          New application
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
            <input {...register('company')} className={inputClass} placeholder="Acme Corp" />
          </Field>
          <Field label="Role *" error={errors.role?.message}>
            <input {...register('role')} className={inputClass} placeholder="Senior Engineer" />
          </Field>
        </div>

        <Field label="Job URL" error={errors.jobUrl?.message}>
          <input
            {...register('jobUrl')}
            className={inputClass}
            placeholder="https://..."
            type="url"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location">
            <input
              {...register('location')}
              className={inputClass}
              placeholder="Remote / San Francisco"
            />
          </Field>
          <Field label="Salary range">
            <input {...register('salaryRange')} className={inputClass} placeholder="$120k–$160k" />
          </Field>
        </div>

        <Field label="Description / Notes">
          <textarea
            {...register('description')}
            className={`${inputClass} h-28 resize-none`}
            placeholder="Job description, notes…"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Source">
            <input
              {...register('source')}
              className={inputClass}
              placeholder="LinkedIn, referral, Indeed…"
            />
          </Field>
          <Field label="Follow-up date">
            <input {...register('followUpAt')} className={inputClass} type="date" />
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
            <input
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
              className={inputClass}
              placeholder="Type a tag and press Enter…"
            />
          </div>
        </Field>

        <div className="flex items-center gap-3">
          <input
            {...register('starred')}
            id="starred-new"
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
          />
          <label
            htmlFor="starred-new"
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving…' : 'Save application'}
          </button>
          <a
            href="/applications"
            className="px-5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
