import type { SeedApplication } from '../../types.js';

const dayMs = 86_400_000;

export const rejectedApplications: SeedApplication[] = [
  {
    company: 'Meta',
    role: 'Software Engineer',
    status: 'rejected',
    jobUrl: 'https://meta.example.com/careers/software-engineer',
    location: 'Menlo Park, CA',
    salaryRange: '$180k – $250k',
    description: 'Work on the core product team building social features.',
    appliedAt: new Date(Date.now() - 30 * dayMs),
    starred: false,
    source: 'Recruiter outreach',
    tags: ['fullstack', 'senior'],
    notes: [
      { content: 'Got through 2 rounds but rejected after the system design interview.' },
      {
        content:
          'Feedback: "Strong coding, but architecture depth wasn\'t sufficient for the level."',
      },
      { content: 'Can reapply in 6 months.' },
    ],
    contacts: [{ name: 'Grace Kim', role: 'Recruiter', email: 'grace@meta.example.com' }],
    interviewRounds: [
      {
        type: 'phone',
        scheduledAt: new Date(Date.now() - 28 * dayMs),
        completedAt: new Date(Date.now() - 28 * dayMs),
        interviewerName: 'Grace Kim',
        outcome: 'passed',
      },
      {
        type: 'technical',
        scheduledAt: new Date(Date.now() - 24 * dayMs),
        completedAt: new Date(Date.now() - 24 * dayMs),
        interviewerName: null,
        outcome: 'passed',
      },
      {
        type: 'onsite',
        scheduledAt: new Date(Date.now() - 21 * dayMs),
        completedAt: new Date(Date.now() - 21 * dayMs),
        interviewerName: null,
        outcome: 'failed',
      },
    ],
  },
  {
    company: 'Airbnb',
    role: 'Senior Full Stack Engineer',
    status: 'rejected',
    jobUrl: 'https://airbnb.example.com/careers/senior-fullstack',
    location: 'San Francisco, CA',
    salaryRange: '$190k – $260k',
    description: 'Build features for the host management platform.',
    appliedAt: new Date(Date.now() - 45 * dayMs),
    starred: false,
    source: 'LinkedIn',
    tags: ['fullstack', 'travel', 'senior'],
    notes: [
      { content: 'Passed phone screen but rejected after coding round.' },
      { content: 'Struggled with the dynamic programming question.' },
    ],
    contacts: [],
    interviewRounds: [
      {
        type: 'phone',
        scheduledAt: new Date(Date.now() - 42 * dayMs),
        completedAt: new Date(Date.now() - 42 * dayMs),
        interviewerName: 'Recruiter',
        outcome: 'passed',
      },
      {
        type: 'technical',
        scheduledAt: new Date(Date.now() - 38 * dayMs),
        completedAt: new Date(Date.now() - 38 * dayMs),
        interviewerName: null,
        outcome: 'failed',
      },
    ],
  },
];
