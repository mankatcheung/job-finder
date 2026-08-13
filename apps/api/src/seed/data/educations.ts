import type { SeedEducation } from '../types.js';

export const educations: SeedEducation[] = [
  {
    institution: 'University of California, Berkeley',
    degree: 'B.S.',
    field: 'Computer Science',
    startDate: new Date('2014-09-01'),
    endDate: new Date('2018-05-15'),
    description:
      'Graduated with honors. Coursework: Data Structures, Algorithms, Distributed Systems, Machine Learning.',
  },
  {
    institution: 'Coursera',
    degree: 'Certificate',
    field: 'Machine Learning',
    startDate: new Date('2021-01-15'),
    endDate: new Date('2021-04-20'),
    description: "Stanford Online — Andrew Ng's Machine Learning course.",
  },
];
