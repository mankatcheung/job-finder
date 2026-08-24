import { createFileRoute } from '@tanstack/react-router';
import { FeatureResumeCoverLetterPage } from './-components/FeatureResumeCoverLetterPage';

const SITE_URL = 'https://www.trakwyn.com';
const TITLE = 'AI Resume & Cover Letter Generator — Trakwyn';
const DESCRIPTION =
  'Resume and cover letter drafts generated from your real work history and tailored to the job — grounded in what you actually entered, never invented.';

export const Route = createFileRoute('/features/resume-cover-letter')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: `${SITE_URL}/features/resume-cover-letter` },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/features/resume-cover-letter` }],
  }),
  component: FeatureResumeCoverLetterPage,
});
