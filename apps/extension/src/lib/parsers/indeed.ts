import type { JobData } from './types';

export function parseIndeed(): JobData | null {
  const role =
    (
      document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"] span') as HTMLElement
    )?.innerText?.trim() ||
    (
      document.querySelector('h1.jobsearch-JobInfoHeader-title') as HTMLElement
    )?.innerText?.trim() ||
    (document.querySelector('h1[class*="jobsearch"]') as HTMLElement)?.innerText?.trim();

  const company =
    (
      document.querySelector('[data-testid="inlineHeader-companyName"] a') as HTMLElement
    )?.innerText?.trim() ||
    (
      document.querySelector('[data-testid="inlineHeader-companyName"]') as HTMLElement
    )?.innerText?.trim() ||
    (document.querySelector('.jobsearch-InlineCompanyRating a') as HTMLElement)?.innerText?.trim();

  const location =
    (
      document.querySelector('[data-testid="inlineHeader-companyLocation"]') as HTMLElement
    )?.innerText?.trim() ||
    (document.querySelector('[data-testid="job-location"]') as HTMLElement)?.innerText?.trim();

  const description =
    (document.querySelector('#jobDescriptionText') as HTMLElement)?.innerText?.trim() ||
    (document.querySelector('.jobsearch-jobDescriptionText') as HTMLElement)?.innerText?.trim();

  if (!company || !role) return null;

  return {
    company,
    role,
    location: location || undefined,
    description: description?.slice(0, 2000) || undefined,
    jobUrl: window.location.href,
    source: 'Indeed',
  };
}
