import { createFileRoute } from '@tanstack/react-router';
import { FeatureAnalyticsPage } from './-components/FeatureAnalyticsPage';

const SITE_URL = 'https://www.trakwyn.com';
const TITLE = 'Job Search Analytics & Insights — Trakwyn';
const DESCRIPTION =
  'Response rates, interview conversion, ghosting detection and channel analytics for your job search pipeline.';

export const Route = createFileRoute('/features/analytics')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}/features/analytics` },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/features/analytics` }],
  }),
  component: FeatureAnalyticsPage,
});
