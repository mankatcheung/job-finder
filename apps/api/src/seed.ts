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
    notes: [{ content: 'Submitted application via LinkedIn Easy Apply.' }],
    contacts: [
      { name: 'Alice Chen', role: 'Engineering Manager', email: 'alice@acme.example.com' },
    ],
    interviewRounds: [],
  },
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
      { content: 'Technical interview scheduled for next week.' },
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
    notes: [{ content: 'Received verbal offer. Negotiating equity.' }],
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
    company: 'Stripe',
    role: 'Backend Engineer',
    status: 'draft',
    jobUrl: 'https://stripe.example.com/jobs/backend-engineer',
    location: 'Remote (US)',
    salaryRange: null,
    description: 'Build and scale payment infrastructure APIs.',
    appliedAt: null,
    starred: false,
    source: 'Hacker News',
    tags: ['backend', 'remote'],
    notes: [],
    contacts: [],
    interviewRounds: [],
  },
  {
    company: 'Meta',
    role: 'Software Engineer',
    status: 'rejected',
    jobUrl: 'https://meta.example.com/careers/software-engineer',
    location: 'Menlo Park, CA',
    salaryRange: '$180k – $250k',
    description: 'Work on the core product team.',
    appliedAt: new Date(Date.now() - 30 * dayMs),
    starred: false,
    source: 'Recruiter outreach',
    tags: ['fullstack', 'senior'],
    notes: [{ content: 'Got through 2 rounds but rejected after the system design interview.' }],
    contacts: [],
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

console.log('\nSeed complete!');
