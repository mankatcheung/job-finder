import type { SeedApplication } from '../../types.js';

const dayMs = 86_400_000;

export const withdrawnApplications: SeedApplication[] = [
  {
    company: 'Uber',
    role: 'Backend Engineer',
    status: 'withdrawn',
    jobUrl: null,
    location: 'San Francisco, CA',
    salaryRange: '$165k – $210k',
    description: 'Work on the rides dispatch platform.',
    appliedAt: new Date(Date.now() - 40 * dayMs),
    starred: false,
    source: 'Referral',
    tags: ['backend', 'platform'],
    notes: [{ content: 'Withdrew after receiving a better offer. Nice team though.' }],
    contacts: [{ name: 'Dan Lee', role: 'Referrer', email: 'dan@example.com' }],
    interviewRounds: [],
  },
];
