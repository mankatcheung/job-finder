import type { SeedNotification } from '../types.js';

const dayMs = 86_400_000;

export const notifications: SeedNotification[] = [
  {
    type: 'interview_reminder',
    title: 'Upcoming interview: Stripe',
    body: 'Your phone screen with Stripe is tomorrow at 2:00 PM EST. Prepare your elevator pitch and review the job description.',
    url: '/applications/stripe-app-id',
    readAt: null,
    createdAt: new Date(Date.now() - 1 * dayMs),
  },
  {
    type: 'follow_up_reminder',
    title: 'Follow up with Google',
    body: "It's been 7 days since your last interview with Google. Consider sending a follow-up email to the recruiter.",
    url: '/applications/google-app-id',
    readAt: new Date(Date.now() - 12 * 3600_000),
    createdAt: new Date(Date.now() - 2 * dayMs),
  },
  {
    type: 'interview_reminder',
    title: 'Upcoming interview: Datadog',
    body: 'Your system design interview with Datadog is in 3 days. Focus on distributed systems patterns and real-world scenarios.',
    url: '/applications/datadog-app-id',
    readAt: null,
    createdAt: new Date(Date.now() - 3 * dayMs),
  },
  {
    type: 'security_alert',
    title: 'New login detected',
    body: 'A new login was detected from Chrome on macOS in San Francisco, CA. If this was you, no action is needed.',
    url: null,
    readAt: new Date(Date.now() - 5 * dayMs),
    createdAt: new Date(Date.now() - 5 * dayMs),
  },
  {
    type: 'follow_up_reminder',
    title: 'Follow up with Airbnb',
    body: "You haven't heard back from Airbnb in 10 days. A polite follow-up could keep your application top of mind.",
    url: '/applications/airbnb-app-id',
    readAt: null,
    createdAt: new Date(Date.now() - 4 * dayMs),
  },
];
