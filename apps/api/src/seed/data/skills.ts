import type { SeedSkill } from '../types.js';

export const skills: SeedSkill[] = [
  // Languages
  { name: 'TypeScript', category: 'Language', proficiency: 'expert' },
  { name: 'JavaScript', category: 'Language', proficiency: 'expert' },
  { name: 'Python', category: 'Language', proficiency: 'advanced' },
  { name: 'SQL', category: 'Language', proficiency: 'advanced' },
  { name: 'Go', category: 'Language', proficiency: 'intermediate' },

  // Frontend
  { name: 'React', category: 'Framework', proficiency: 'expert' },
  { name: 'Next.js', category: 'Framework', proficiency: 'advanced' },
  { name: 'Tailwind CSS', category: 'Library', proficiency: 'expert' },
  { name: 'TanStack Query', category: 'Library', proficiency: 'advanced' },
  { name: 'GraphQL', category: 'Technology', proficiency: 'advanced' },

  // Backend
  { name: 'Node.js', category: 'Runtime', proficiency: 'expert' },
  { name: 'Fastify', category: 'Framework', proficiency: 'advanced' },
  { name: 'PostgreSQL', category: 'Database', proficiency: 'advanced' },
  { name: 'Redis', category: 'Database', proficiency: 'intermediate' },
  { name: 'SQLite', category: 'Database', proficiency: 'advanced' },

  // DevOps & Tools
  { name: 'Git', category: 'Tool', proficiency: 'expert' },
  { name: 'Docker', category: 'Tool', proficiency: 'intermediate' },
  { name: 'CI/CD', category: 'Practice', proficiency: 'advanced' },
  { name: 'AWS', category: 'Platform', proficiency: 'intermediate' },
  { name: 'Vercel', category: 'Platform', proficiency: 'advanced' },

  // Soft skills
  { name: 'Technical Writing', category: 'Soft Skill', proficiency: 'advanced' },
  { name: 'Code Review', category: 'Practice', proficiency: 'expert' },
  { name: 'Mentoring', category: 'Soft Skill', proficiency: 'advanced' },
];
