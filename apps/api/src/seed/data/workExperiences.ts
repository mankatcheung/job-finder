import type { SeedWorkExperience } from '../types.js';

export const workExperiences: SeedWorkExperience[] = [
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
