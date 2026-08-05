import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { gqlClient } from '#/graphql/client';
import { PlusIcon, Trash2Icon } from 'lucide-react';

type Stage = {
  id: string;
  key: string;
  name: string;
  color: string;
  position: number;
  category: string;
};

const STAGES_QUERY = `query PipelineStages { pipelineStages { id key name color position category } }`;
const CREATE_STAGE = `mutation CreatePipelineStage($input: CreatePipelineStageInput!) { createPipelineStage(input: $input) { id key name color position category } }`;
const DELETE_STAGE = `mutation DeletePipelineStage($id: ID!) { deletePipelineStage(id: $id) }`;

const CATEGORIES = [
  ['backlog', 'Backlog'],
  ['active', 'Active'],
  ['interviewing', 'Interviewing'],
  ['offered', 'Offered'],
  ['accepted', 'Accepted'],
  ['rejected', 'Rejected'],
  ['withdrawn', 'Withdrawn'],
] as const;

export const Route = createFileRoute('/_authenticated/settings/pipeline')({
  component: PipelineSettingsPage,
});

function PipelineSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['pipelineStages'],
    queryFn: () => gqlClient.request<{ pipelineStages: Stage[] }>(STAGES_QUERY),
  });
  const [name, setName] = useState('');
  const [category, setCategory] = useState('active');
  const [color, setColor] = useState('gray');
  const [error, setError] = useState<string | null>(null);
  const stages = [...(data?.pipelineStages ?? [])].sort((a, b) => a.position - b.position);

  const addStage = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await gqlClient.request(CREATE_STAGE, {
        input: {
          key: trimmed,
          name: trimmed,
          color,
          position: stages.length,
          category,
        },
      });
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['pipelineStages'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create stage');
    }
  };

  const removeStage = async (id: string) => {
    try {
      await gqlClient.request(DELETE_STAGE, { id });
      await queryClient.invalidateQueries({ queryKey: ['pipelineStages'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete stage');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pipeline stages</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize the columns used by your applications board. Existing applications keep their
          current stage when you rename or remove a column.
        </p>
      </div>

      <form
        onSubmit={addStage}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_8rem_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New stage name"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={color}
            onChange={(event) => setColor(event.target.value)}
            placeholder="Color"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <PlusIcon size={15} /> Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading stages…</p>
      ) : (
        <div className="space-y-2">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-gray-400" title={stage.color} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{stage.name}</p>
                  <p className="text-xs text-gray-500">
                    {stage.key} · {stage.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeStage(stage.id)}
                aria-label={`Delete ${stage.name}`}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <Trash2Icon size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
