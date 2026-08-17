import type { JobData } from './types';
import { parseLinkedIn } from './linkedin';
import { parseIndeed } from './indeed';
import { parseGeneric } from './generic';

export type { JobData };

export function parseJobPage(): JobData | null {
  const { hostname } = window.location;

  // Site-specific parsers target the standalone job-detail page layout;
  // fall back to the generic JSON-LD JobPosting parser when they come up
  // empty (e.g. LinkedIn/Indeed's search-results split-pane view, or a
  // markup change) rather than reporting no data at all.
  if (hostname.includes('linkedin.com')) return parseLinkedIn() ?? parseGeneric();
  if (hostname.includes('indeed.com')) return parseIndeed() ?? parseGeneric();

  return parseGeneric();
}
