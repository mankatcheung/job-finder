import type { JobData } from './types';

export function parseLinkedIn(): JobData | null {
  const company =
    (document.querySelector('.topcard__org-name-link') as HTMLElement)?.innerText?.trim() ||
    (document.querySelector('[data-tracking-control-name="public_jobs_topcard-org-name"]') as HTMLElement)?.innerText?.trim() ||
    (document.querySelector('.job-details-jobs-unified-top-card__company-name a') as HTMLElement)?.innerText?.trim();

  const role =
    (document.querySelector('h1.topcard__title') as HTMLElement)?.innerText?.trim() ||
    (document.querySelector('h1.t-24.t-bold') as HTMLElement)?.innerText?.trim() ||
    (document.querySelector('.job-details-jobs-unified-top-card__job-title h1') as HTMLElement)?.innerText?.trim();

  const location =
    (document.querySelector('.topcard__flavor--bullet') as HTMLElement)?.innerText?.trim() ||
    (document.querySelector('.job-details-jobs-unified-top-card__primary-description-container span') as HTMLElement)?.innerText?.trim();

  const description =
    (document.querySelector('.description__text') as HTMLElement)?.innerText?.trim() ||
    (document.querySelector('#job-details') as HTMLElement)?.innerText?.trim();

  if (!company || !role) return null;

  return {
    company,
    role,
    location: location || undefined,
    description: description?.slice(0, 2000) || undefined,
    jobUrl: window.location.href,
    source: 'LinkedIn',
  };
}
