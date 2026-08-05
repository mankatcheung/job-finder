#!/usr/bin/env tsx
/**
 * Database seed script — populates a Turso (or local SQLite) database with
 * demo data so preview environments have something useful to explore.
 *
 * Usage:
 *   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... pnpm db:seed
 *
 * Safe to run multiple times — it deletes any existing demo user (cascading to
 * all related rows) before inserting fresh data, so re-seeding is clean.
 */

import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// Import the Drizzle db instance directly (creates the libsql connection as a
// side effect, reading DATABASE_URL / DATABASE_AUTH_TOKEN from process.env).
import { db } from './infrastructure/db/client.js';
import {
  user,
  jobApplication,
  applicationTag,
  note,
  activityLog,
  contact,
  interviewRound,
  workExperience,
  education,
  skill,
} from './infrastructure/db/schema.js';
import type { ApplicationStatus } from './domain/application/ApplicationStatus.js';

// ---------------------------------------------------------------------------
// Demo user
// ---------------------------------------------------------------------------
const DEMO_EMAIL = 'demo@jobfinder.app';
const DEMO_PASSWORD = 'demo1234';

const userId = nanoid();
const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

// Remove any previous demo user (cascading deletes handle related rows).
const existing = await db
  .select({ id: user.id })
  .from(user)
  .where(eq(user.email, DEMO_EMAIL))
  .limit(1);

if (existing.length > 0) {
  await db.delete(user).where(eq(user.id, existing[0].id));
  console.log('  Removed existing demo user');
}

const now = new Date();

await db.insert(user).values({
  id: userId,
  email: DEMO_EMAIL,
  passwordHash,
  name: 'Demo User',
  timezone: 'America/New_York',
  targetRole: 'Senior Software Engineer',
  emailVerifiedAt: now,
  weeklyDigestEnabled: true,
  followUpRemindersEnabled: true,
  totpEnabled: false,
  createdAt: now,
  updatedAt: now,
});
console.log(`  Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

// ---------------------------------------------------------------------------
// Sample applications
// ---------------------------------------------------------------------------
const dayMs = 86_400_000;

interface SeedApplication {
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  appliedAt: Date | null;
  starred: boolean;
  source: string | null;
  tags: string[];
  notes: { content: string }[];
  contacts: { name: string; role: string | null; email: string | null }[];
  interviewRounds: {
    type: string;
    scheduledAt: Date | null;
    completedAt: Date | null;
    interviewerName: string | null;
    outcome: string;
  }[];
}

const applications: SeedApplication[] = [
  // ── Draft ──────────────────────────────────────────────────────────────
  {
    company: 'Vercel',
    role: 'Senior DX Engineer',
    status: 'draft',
    jobUrl: 'https://vercel.example.com/careers/dx-engineer',
    location: 'Remote (Global)',
    salaryRange: '$180k – $230k',
    description: 'Improve developer experience across Next.js and Vercel platform tooling.',
    appliedAt: null,
    starred: false,
    source: 'Company website',
    tags: ['dx', 'remote', 'senior'],
    notes: [{ content: 'Need to finish updating portfolio before applying.' }],
    contacts: [],
    interviewRounds: [],
  },
  {
    company: 'Cloudflare',
    role: 'Systems Engineer',
    status: 'draft',
    jobUrl: 'https://cloudflare.example.com/jobs/systems-engineer',
    location: 'Austin, TX (Hybrid)',
    salaryRange: '$155k – $195k',
    description: 'Work on edge computing infrastructure and Workers runtime.',
    appliedAt: null,
    starred: false,
    source: 'Hacker News',
    tags: ['systems', 'infrastructure'],
    notes: [],
    contacts: [],
    interviewRounds: [],
  },

  // ── Applied ────────────────────────────────────────────────────────────
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

  // ── Interviewing ───────────────────────────────────────────────────────
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

  // ── Offered ────────────────────────────────────────────────────────────
  {
    company: 'StartupXYZ',
    role: 'Lead Developer',
    status: 'offered',
    jobUrl: null,
    location: 'Austin, TX',
    salaryRange: '$170k – $220k + equity',
    description: 'Lead a team of 4 engineers building the next-gen analytics platform.',
    appliedAt: new Date(Date.now() - 21 * dayMs),
    starred: true,
    source: 'Referral',
    tags: ['senior', 'leadership', 'startup'],
    notes: [
      { content: 'Received verbal offer. Negotiating equity.' },
      { content: 'Offer letter received: $185k base, 0.15% equity, 4yr vest.' },
      { content: 'Considering counter-offer from current employer.' },
    ],
    contacts: [{ name: 'Eve Johnson', role: 'CTO', email: 'eve@startupxyz.example.com' }],
    interviewRounds: [
      {
        type: 'phone',
        scheduledAt: new Date(Date.now() - 18 * dayMs),
        completedAt: new Date(Date.now() - 18 * dayMs),
        interviewerName: 'Eve Johnson',
        outcome: 'passed',
      },
      {
        type: 'technical',
        scheduledAt: new Date(Date.now() - 14 * dayMs),
        completedAt: new Date(Date.now() - 14 * dayMs),
        interviewerName: 'Frank Lee',
        outcome: 'passed',
      },
      {
        type: 'onsite',
        scheduledAt: new Date(Date.now() - 10 * dayMs),
        completedAt: new Date(Date.now() - 10 * dayMs),
        interviewerName: null,
        outcome: 'passed',
      },
    ],
  },
  {
    company: 'Datadog',
    role: 'Senior Backend Engineer',
    status: 'offered',
    jobUrl: 'https://datadog.example.com/jobs/senior-backend',
    location: 'New York, NY (Hybrid)',
    salaryRange: '$185k – $250k',
    description:
      'Build observability pipeline infrastructure handling millions of events per second.',
    appliedAt: new Date(Date.now() - 35 * dayMs),
    starred: false,
    source: 'Recruiter outreach',
    tags: ['backend', 'infrastructure', 'observability'],
    notes: [
      { content: 'Solid offer but role is hybrid 3 days/week — commute is 45 min.' },
      { content: 'Great benefits: 20% learning budget, conference attendance.' },
    ],
    contacts: [
      { name: 'Tom Wilson', role: 'Staff Engineer', email: 'tom@datadog.example.com' },
      { name: 'Lisa Chang', role: 'Recruiter', email: 'lisa@datadog.example.com' },
    ],
    interviewRounds: [
      {
        type: 'phone',
        scheduledAt: new Date(Date.now() - 30 * dayMs),
        completedAt: new Date(Date.now() - 30 * dayMs),
        interviewerName: 'Lisa Chang',
        outcome: 'passed',
      },
      {
        type: 'technical',
        scheduledAt: new Date(Date.now() - 25 * dayMs),
        completedAt: new Date(Date.now() - 25 * dayMs),
        interviewerName: 'Tom Wilson',
        outcome: 'passed',
      },
      {
        type: 'system-design',
        scheduledAt: new Date(Date.now() - 20 * dayMs),
        completedAt: new Date(Date.now() - 20 * dayMs),
        interviewerName: 'Architecture team',
        outcome: 'passed',
      },
      {
        type: 'culture',
        scheduledAt: new Date(Date.now() - 15 * dayMs),
        completedAt: new Date(Date.now() - 15 * dayMs),
        interviewerName: 'VP Engineering',
        outcome: 'passed',
      },
    ],
  },

  // ── Rejected ───────────────────────────────────────────────────────────
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
        outcome: 'rejected',
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
        outcome: 'rejected',
      },
    ],
  },

  // ── Withdrawn ──────────────────────────────────────────────────────────
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

for (const app of applications) {
  const appId = nanoid();

  await db.insert(jobApplication).values({
    id: appId,
    userId,
    company: app.company,
    role: app.role,
    status: app.status,
    jobUrl: app.jobUrl,
    location: app.location,
    salaryRange: app.salaryRange,
    description: app.description,
    appliedAt: app.appliedAt,
    starred: app.starred,
    source: app.source,
    createdAt: now,
    updatedAt: now,
  });

  // Tags
  for (const tagName of app.tags) {
    await db.insert(applicationTag).values({
      id: nanoid(),
      applicationId: appId,
      name: tagName,
    });
  }

  // Notes
  for (const noteEntry of app.notes) {
    await db.insert(note).values({
      id: nanoid(),
      applicationId: appId,
      content: noteEntry.content,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(activityLog).values({
      id: nanoid(),
      applicationId: appId,
      actorId: userId,
      eventType: 'note_added',
      payload: JSON.stringify({ note: noteEntry.content.substring(0, 100) }),
      createdAt: now,
    });
  }

  // Contacts
  for (const contactEntry of app.contacts) {
    await db.insert(contact).values({
      id: nanoid(),
      applicationId: appId,
      name: contactEntry.name,
      role: contactEntry.role,
      email: contactEntry.email,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Interview rounds
  for (const round of app.interviewRounds) {
    await db.insert(interviewRound).values({
      id: nanoid(),
      applicationId: appId,
      type: round.type,
      scheduledAt: round.scheduledAt,
      completedAt: round.completedAt,
      interviewerName: round.interviewerName,
      outcome: round.outcome,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(activityLog).values({
      id: nanoid(),
      applicationId: appId,
      actorId: userId,
      eventType: 'interview_round_added',
      payload: JSON.stringify({ type: round.type, outcome: round.outcome }),
      createdAt: now,
    });
  }

  // Activity log for the application status
  await db.insert(activityLog).values({
    id: nanoid(),
    applicationId: appId,
    actorId: userId,
    eventType: 'status_change',
    payload: JSON.stringify({ status: app.status }),
    createdAt: now,
  });

  console.log(`  Created application: ${app.company} — ${app.role} (${app.status})`);
}

// ---------------------------------------------------------------------------
// Work experience
// ---------------------------------------------------------------------------
const workExperiences = [
  {
    company: 'Acme Corp',
    title: 'Software Engineer',
    location: 'San Francisco, CA',
    startDate: new Date('2022-03-01'),
    endDate: new Date('2024-06-30'),
    description:
      'Built and maintained the main SaaS dashboard. Led the migration from class components to React hooks. Mentored 2 junior engineers.',
  },
  {
    company: 'TechStartup Inc.',
    title: 'Frontend Developer',
    location: 'Remote',
    startDate: new Date('2020-06-01'),
    endDate: new Date('2022-02-28'),
    description:
      'Developed the customer-facing web app from 0 to 1. Implemented real-time collaboration features using WebSockets.',
  },
  {
    company: 'Digital Agency Co.',
    title: 'Junior Developer',
    location: 'New York, NY',
    startDate: new Date('2018-09-01'),
    endDate: new Date('2020-05-31'),
    description:
      'Built responsive websites and e-commerce storefronts for clients. Worked with React, Node.js, and PostgreSQL.',
  },
];

for (const we of workExperiences) {
  await db.insert(workExperience).values({
    id: nanoid(),
    userId,
    company: we.company,
    title: we.title,
    location: we.location,
    startDate: we.startDate,
    endDate: we.endDate,
    description: we.description,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`  Created work experience: ${we.title} at ${we.company}`);
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------
const educations = [
  {
    institution: 'University of California, Berkeley',
    degree: 'B.S.',
    field: 'Computer Science',
    startDate: new Date('2014-09-01'),
    endDate: new Date('2018-05-15'),
    description:
      'Graduated with honors. Coursework: Data Structures, Algorithms, Distributed Systems, Machine Learning.',
  },
  {
    institution: 'Coursera',
    degree: 'Certificate',
    field: 'Machine Learning',
    startDate: new Date('2021-01-15'),
    endDate: new Date('2021-04-20'),
    description: "Stanford Online — Andrew Ng's Machine Learning course.",
  },
];

for (const edu of educations) {
  await db.insert(education).values({
    id: nanoid(),
    userId,
    institution: edu.institution,
    degree: edu.degree,
    field: edu.field,
    startDate: edu.startDate,
    endDate: edu.endDate,
    description: edu.description,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`  Created education: ${edu.degree} in ${edu.field} at ${edu.institution}`);
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------
const skills = [
  // Languages
  { name: 'TypeScript', category: 'Language', proficiency: 'expert' },
  { name: 'JavaScript', category: 'Language', proficiency: 'expert' },
  { name: 'Python', category: 'Language', proficiency: 'advanced' },
  { name: 'SQL', category: 'Language', proficiency: 'advanced' },
  { name: 'Go', category: 'Language', proficiency: 'intermediate' },

  // Frontend
  { name: 'React', category: 'Framework', proficiency: 'expert' },
  { name: 'Next.js', category: 'Framework', proficiency: 'advanced' },
  { name: 'Tailwind CSS', category: 'Library', proficiency: 'expert' },
  { name: 'TanStack Query', category: 'Library', proficiency: 'advanced' },
  { name: 'GraphQL', category: 'Technology', proficiency: 'advanced' },

  // Backend
  { name: 'Node.js', category: 'Runtime', proficiency: 'expert' },
  { name: 'Fastify', category: 'Framework', proficiency: 'advanced' },
  { name: 'PostgreSQL', category: 'Database', proficiency: 'advanced' },
  { name: 'Redis', category: 'Database', proficiency: 'intermediate' },
  { name: 'SQLite', category: 'Database', proficiency: 'advanced' },

  // DevOps & Tools
  { name: 'Git', category: 'Tool', proficiency: 'expert' },
  { name: 'Docker', category: 'Tool', proficiency: 'intermediate' },
  { name: 'CI/CD', category: 'Practice', proficiency: 'advanced' },
  { name: 'AWS', category: 'Platform', proficiency: 'intermediate' },
  { name: 'Vercel', category: 'Platform', proficiency: 'advanced' },

  // Soft skills
  { name: 'Technical Writing', category: 'Soft Skill', proficiency: 'advanced' },
  { name: 'Code Review', category: 'Practice', proficiency: 'expert' },
  { name: 'Mentoring', category: 'Soft Skill', proficiency: 'advanced' },
];

for (const s of skills) {
  await db.insert(skill).values({
    id: nanoid(),
    userId,
    name: s.name,
    category: s.category,
    proficiency: s.proficiency,
    createdAt: now,
  });
  console.log(`  Created skill: ${s.name} (${s.proficiency})`);
}

console.log('\nSeed complete!');
