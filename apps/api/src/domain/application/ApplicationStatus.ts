export const APPLICATION_STATUSES = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

// Status values are user-scoped pipeline stage keys. The legacy constants are
// retained as the default stage set and for semantic business rules.
export type ApplicationStatus = string;
