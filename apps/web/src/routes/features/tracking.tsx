import { createFileRoute } from '@tanstack/react-router';
import { FeatureTrackingPage } from './-components/FeatureTrackingPage';

const SITE_URL = 'https://www.trakwyn.com';
const TITLE = 'Application Tracking & Kanban Board — Trakwyn';
const DESCRIPTION =
  'Track every job application on a Kanban board or list, with notes, contacts, documents and reminders attached to each one.';

export const Route = createFileRoute('/features/tracking')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}/features/tracking` },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/features/tracking` }],
  }),
  component: FeatureTrackingPage,
});
