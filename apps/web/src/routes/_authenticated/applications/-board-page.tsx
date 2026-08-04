import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { gqlClient } from '#/graphql/client';
import type { ApplicationStatus } from '#/graphql/generated/graphql';
import { StatusBadge } from '../dashboard';
import { ErrorState } from '#/components/ErrorState';
import { ListIcon, PlusIcon, StarIcon } from 'lucide-react';
import { boardApplicationsQueryOptions, type BoardApplication } from './-board-queries';

const UPDATE_STATUS = `
  mutation UpdateApplicationStatus($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) { id status }
  }
`;

type Application = BoardApplication;

const STATUSES: ApplicationStatus[] = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-t-gray-400',
  applied: 'border-t-blue-500',
  interviewing: 'border-t-purple-500',
  offered: 'border-t-orange-500',
  accepted: 'border-t-green-500',
  rejected: 'border-t-red-500',
  withdrawn: 'border-t-gray-500',
};

export function KanbanBoard() {
  const qc = useQueryClient();
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery(boardApplicationsQueryOptions);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      gqlClient.request(UPDATE_STATUS, { id, input: { status } }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['applications', null] });

      const prevData = qc.getQueryData<{ applications: Application[] }>(['applications', null]);

      qc.setQueryData<{ applications: Application[] }>(['applications', null], (old) => {
        if (!old?.applications) return old;
        return {
          ...old,
          applications: old.applications.map((a) =>
            a.id === id ? { ...a, status: status as ApplicationStatus } : a,
          ),
        };
      });

      return { prevData };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevData) {
        qc.setQueryData(['applications', null], context.prevData);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const apps = data?.applications ?? [];
  const byStatus = (status: string) => apps.filter((a) => a.status === status);

  function handleDragStart(event: DragStartEvent) {
    const app = apps.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const newStatus = over.id as string;
    if (!STATUSES.includes(newStatus as ApplicationStatus)) return;

    const app = apps.find((a) => a.id === active.id);
    if (!app || app.status === newStatus) return;

    updateStatus.mutate({ id: app.id, status: newStatus });
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 min-h-screen">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-60 h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6 min-h-screen">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Board</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/applications"
            aria-label="Switch to list view"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <ListIcon size={13} />
            <span className="hidden sm:inline">List</span>
          </Link>
          <Link
            to="/applications/new"
            aria-label="New application"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon size={15} />
            <span className="hidden sm:inline">+ New</span>
          </Link>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <Column key={status} status={status} apps={byStatus(status)} />
          ))}
        </div>

        <DragOverlay>{activeApp && <AppCard app={activeApp} isDragging />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, apps }: { status: string; apps: Application[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-60 rounded-xl border-t-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 ${STATUS_COLORS[status] ?? 'border-t-gray-400'} transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
          {status}
        </span>
        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
          {apps.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-2 min-h-[120px]">
        {apps.map((app) => (
          <DraggableCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <AppCard app={app} />
    </div>
  );
}

function AppCard({ app, isDragging }: { app: Application; isDragging?: boolean }) {
  return (
    <Link
      to="/applications/$applicationId"
      params={{ applicationId: app.id }}
      className={`block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors ${isDragging ? 'shadow-xl rotate-1' : ''}`}
      onClick={(e) => {
        if (isDragging) e.preventDefault();
      }}
    >
      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
        {app.company}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{app.role}</p>
      {app.location && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{app.location}</p>}
      <div className="flex items-center justify-between mt-2">
        {app.starred && <StarIcon size={11} className="text-yellow-400 fill-yellow-400" />}
        <StatusBadge status={app.status as ApplicationStatus} />
      </div>
    </Link>
  );
}
