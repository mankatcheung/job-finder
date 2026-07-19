import type { JobData } from './types';
import { parseLinkedIn } from './linkedin';
import { parseIndeed } from './indeed';
import { parseGeneric } from './generic';

export type { JobData };

export function parseJobPage(): JobData | null {
  const { hostname } = window.location;

  if (hostname.includes('linkedin.com')) return parseLinkedIn();
  if (hostname.includes('indeed.com')) return parseIndeed();

  return parseGeneric();
}
