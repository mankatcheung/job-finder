import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { StarIcon, XIcon } from 'lucide-react';
import { JdImportPanel } from '../_components/JdImportPanel';

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

const APPLICATION_QUERY = `
  query Application($id: ID!) {
    application(id: $id) {
      id company role status jobUrl location salaryRange description appliedAt starred source followUpAt tags createdAt updatedAt
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
  starred: boolean;
  source?: string | null;
  followUpAt?: string | null;
  tags: string[];
};

export const Route = createFileRoute('/_authenticated/applications/$applicationId/edit')({
  component: EditApplicationPage,
});

export function EditApplicationPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () =>
      gqlClient.request<{ application: Application }>(APPLICATION_QUERY, { id: applicationId }),
  });

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

  const onSubmit = async (values: FormValues) => {
    try {
      await gqlClient.request(UPDATE_MUTATION, {
        id: applicationId,
        input: {
          ...values,
          tags,
          followUpAt: values.followUpAt || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      navigate({ to: '/applications/$applicationId', params: { applicationId } });
    } catch {
      setError('root', { message: 'Failed to update application' });
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await gqlClient.request(
        `mutation DeleteApplication($id: ID!) { deleteApplication(id: $id) }`,
        { id: applicationId },
      );
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      navigate({ to: '/applications' });
    } catch {
      alert('Failed to delete application');
    }
  };

  if (!app) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Application</h1>
        <button
          onClick={handleDelete}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
        >
          <StarIcon size={18} />
        </button>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setImportOpen(!importOpen)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {importOpen ? 'Hide' : 'Show'} AI Job Description Import
        </button>
        {importOpen && (
          <div className="mt-2">
            <JdImportPanel
              onFill={(data) => {
                if (data.company) setValue('company', data.company);
                if (data.role) setValue('role', data.role);
                if (data.location) setValue('location', data.location);
                if (data.salary) setValue('salaryRange', data.salary);
                if (data.description) setValue('description', data.description);
              }}
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{errors.root.message}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
          <input
            {...register('company')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <input
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
          <input
            {...register('jobUrl')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://..."
          />
          {errors.jobUrl && <p className="text-red-500 text-xs mt-1">{errors.jobUrl.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              {...register('location')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
            <input
              {...register('salaryRange')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input
              {...register('source')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="LinkedIn, referral, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
            <input
              {...register('followUpAt')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <XIcon size={14} />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type a tag and press Enter"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('starred')}
            id="starred"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="starred" className="text-sm text-gray-700">
            Starred
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate({ to: '/applications/$applicationId', params: { applicationId } })
            }
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
