import type { SeedApplication } from '../../types.js';

const dayMs = 86_400_000;

export const appliedApplications: SeedApplication[] = [
  {
    company: 'Acme Corp',
    role: 'Senior Frontend Engineer',
    status: 'applied',
    jobUrl: 'https://acme.example.com/careers/senior-frontend',
    location: 'San Francisco, CA (Remote)',
    salaryRange: '$160k – $200k',
    description: 'Build and maintain the main product dashboard using React and TypeScript.',
    appliedAt: new Date(Date.now() - 5 * dayMs),
    starred: true,
    source: 'LinkedIn',
    tags: ['frontend', 'senior', 'remote'],
    notes: [
      { content: 'Submitted application via LinkedIn Easy Apply.' },
      { content: 'Job posting emphasizes experience with design systems — tailor cover letter.' },
    ],
    contacts: [
      { name: 'Alice Chen', role: 'Engineering Manager', email: 'alice@acme.example.com' },
    ],
    interviewRounds: [],
  },
  {
    company: 'Notion',
    role: 'Product Engineer',
    status: 'applied',
    jobUrl: 'https://notion.example.com/careers/product-engineer',
    location: 'New York, NY',
    salaryRange: '$150k – $190k',
    description: "Build collaborative features for Notion's workspace product.",
    appliedAt: new Date(Date.now() - 3 * dayMs),
    starred: false,
    source: 'LinkedIn',
    tags: ['product', 'frontend', 'collaboration'],
    notes: [{ content: 'Applied through referral from Jamie (ex-colleague).' }],
    contacts: [{ name: 'Jamie Park', role: 'Referrer', email: 'jamie@example.com' }],
    interviewRounds: [],
  },
  {
    company: 'Linear',
    role: 'Senior Software Engineer',
    status: 'applied',
    jobUrl: 'https://linear.example.com/careers/senior-engineer',
    location: 'Remote (US/EU)',
    salaryRange: '$170k – $210k',
    description: 'Build high-performance project management tools with TypeScript and React.',
    appliedAt: new Date(Date.now() - 1 * dayMs),
    starred: true,
    source: 'Company website',
    tags: ['fullstack', 'typescript', 'remote'],
    notes: [{ content: 'Love their product. Very aligned with how I think about tooling.' }],
    contacts: [],
    interviewRounds: [],
  },
];
