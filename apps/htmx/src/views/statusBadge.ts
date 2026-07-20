export function statusBadge(status: string): string {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    applied: 'bg-blue-100 text-blue-700',
    interviewing: 'bg-yellow-100 text-yellow-700',
    offered: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    withdrawn: 'bg-gray-100 text-gray-500',
  };
  const cls = styles[status] ?? styles['draft']!;
  return `<span class="text-xs font-medium px-2 py-0.5 rounded-full capitalize ${cls}">${status}</span>`;
}

export const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  applied: '#3b82f6',
  interviewing: '#eab308',
  offered: '#22c55e',
  rejected: '#ef4444',
  accepted: '#10b981',
  withdrawn: '#6b7280',
};

export const ALL_STATUSES = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
] as const;
