import type { SeedApplication } from '../../types.js';

const dayMs = 86_400_000;

export const interviewingApplications: SeedApplication[] = [
  {
    company: 'TechCorp',
    role: 'Full Stack Developer',
    status: 'interviewing',
    jobUrl: 'https://techcorp.example.com/jobs/fullstack-dev',
    location: 'New York, NY',
    salaryRange: '$140k – $180k',
    description: 'Work across the stack on a SaaS platform serving 10k+ businesses.',
    appliedAt: new Date(Date.now() - 14 * dayMs),
    starred: false,
    source: 'Company website',
    tags: ['fullstack', 'react', 'node'],
    notes: [
      { content: 'Had a great phone screen with the recruiter.' },
      { content: 'Technical interview scheduled for next week. Need to review system design.' },
      { content: 'Recruiter mentioned team is growing from 8 to 15 engineers.' },
    ],
    contacts: [
      { name: 'Bob Martinez', role: 'Recruiter', email: 'bob@techcorp.example.com' },
      { name: 'Carol Wu', role: 'Hiring Manager', email: 'carol@techcorp.example.com' },
    ],
    interviewRounds: [
      {
        type: 'phone',
        scheduledAt: new Date(Date.now() - 7 * dayMs),
        completedAt: new Date(Date.now() - 7 * dayMs),
        interviewerName: 'Bob Martinez',
        outcome: 'passed',
      },
      {
        type: 'technical',
        scheduledAt: new Date(Date.now() + 3 * dayMs),
        completedAt: null,
        interviewerName: 'David Park',
        outcome: 'pending',
      },
    ],
  },
  {
    company: 'Shopify',
    role: 'Staff Engineer',
    status: 'interviewing',
    jobUrl: 'https://shopify.example.com/careers/staff-engineer',
    location: 'Remote (Global)',
    salaryRange: '$200k – $280k',
    description: 'Lead technical initiatives across the commerce platform.',
    appliedAt: new Date(Date.now() - 21 * dayMs),
    starred: true,
    source: 'Recruiter outreach',
    tags: ['staff', 'leadership', 'commerce'],
    notes: [
      { content: 'Recruiter reached out on LinkedIn. Interesting role.' },
      { content: 'Had first round — deep dive on distributed systems.' },
      { content: 'Panel interview next week covering architecture and leadership.' },
    ],
    contacts: [
      { name: 'Sarah Kim', role: 'Technical Recruiter', email: 'sarah@shopify.example.com' },
    ],
    interviewRounds: [
      {
        type: 'phone',
        scheduledAt: new Date(Date.now() - 14 * dayMs),
        completedAt: new Date(Date.now() - 14 * dayMs),
        interviewerName: 'Sarah Kim',
        outcome: 'passed',
      },
      {
        type: 'technical',
        scheduledAt: new Date(Date.now() - 7 * dayMs),
        completedAt: new Date(Date.now() - 7 * dayMs),
        interviewerName: 'Marcus Chen',
        outcome: 'passed',
      },
      {
        type: 'onsite',
        scheduledAt: new Date(Date.now() + 5 * dayMs),
        completedAt: null,
        interviewerName: null,
        outcome: 'pending',
      },
    ],
  },
  {
    company: 'Figma',
    role: 'Frontend Infrastructure Engineer',
    status: 'interviewing',
    jobUrl: 'https://figma.example.com/careers/frontend-infra',
    location: 'San Francisco, CA',
    salaryRange: '$175k – $240k',
    description: "Build the rendering engine and collaboration infrastructure for Figma's web app.",
    appliedAt: new Date(Date.now() - 10 * dayMs),
    starred: false,
    source: 'Conference talk',
    tags: ['frontend', 'infrastructure', 'graphics'],
    notes: [
      { content: 'Met the hiring manager at React Summit. Great conversation about WebGL perf.' },
      { content: 'Take-home assignment: build a simple collaborative canvas.' },
    ],
    contacts: [
      { name: 'Nina Patel', role: 'Engineering Manager', email: 'nina@figma.example.com' },
    ],
    interviewRounds: [
      {
        type: 'phone',
        scheduledAt: new Date(Date.now() - 8 * dayMs),
        completedAt: new Date(Date.now() - 8 * dayMs),
        interviewerName: 'Nina Patel',
        outcome: 'passed',
      },
      {
        type: 'technical',
        scheduledAt: new Date(Date.now() + 2 * dayMs),
        completedAt: null,
        interviewerName: 'Team member',
        outcome: 'pending',
      },
    ],
  },
];
