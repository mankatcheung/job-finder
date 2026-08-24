import { createFileRoute } from '@tanstack/react-router';
import { FeaturesIndexPage } from './-components/FeaturesIndexPage';

const SITE_URL = 'https://www.trakwyn.com';
const TITLE = 'Features — Trakwyn';
const DESCRIPTION =
  'See what Trakwyn actually does: application tracking with a Kanban board, an AI assistant, AI resume & cover letter generation, and analytics — plus everything else that keeps a job search on track.';

export const Route = createFileRoute('/features/')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}/features` },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/features` }],
  }),
  component: FeaturesIndexPage,
});
