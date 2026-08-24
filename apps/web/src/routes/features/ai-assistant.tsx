import { createFileRoute } from '@tanstack/react-router';
import { FeatureAiAssistantPage } from './-components/FeatureAiAssistantPage';

const SITE_URL = 'https://www.trakwyn.com';
const TITLE = 'AI Job Search Assistant — Trakwyn';
const DESCRIPTION =
  'An AI assistant that knows your applications, notes and interviews — bring your own OpenAI, Anthropic, or compatible key.';

export const Route = createFileRoute('/features/ai-assistant')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}/features/ai-assistant` },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/features/ai-assistant` }],
  }),
  component: FeatureAiAssistantPage,
});
