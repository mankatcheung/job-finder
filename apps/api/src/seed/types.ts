import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

export interface SeedNote {
  content: string;
}

export interface SeedContact {
  name: string;
  role: string | null;
  email: string | null;
}

export interface SeedInterviewRound {
  type: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  interviewerName: string | null;
  outcome: string;
}

export interface SeedOffer {
  baseSalary: number;
  bonus: number | null;
  equity: string | null;
  benefits: string | null;
  costOfLivingAdjustment: number | null;
  currency: string;
  period: string;
  notes: string | null;
}

export interface SeedApplication {
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  location: string | null;
  salaryRange: string | null;
  description: string | null;
  appliedAt: Date | null;
  starred: boolean;
  source: string | null;
  tags: string[];
  notes: SeedNote[];
  contacts: SeedContact[];
  interviewRounds: SeedInterviewRound[];
  offers?: SeedOffer[];
}

export interface SeedWorkExperience {
  company: string;
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface SeedEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface SeedSkill {
  name: string;
  category: string;
  proficiency: string;
}

export interface SeedMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SeedConversation {
  title: string;
  llmProvider: string;
  llmModel: string;
  messages: SeedMessage[];
}

export type SeedNotificationType = 'interview_reminder' | 'follow_up_reminder' | 'security_alert';

export interface SeedNotification {
  type: SeedNotificationType;
  title: string;
  body: string;
  url: string | null;
  readAt: Date | null;
  createdAt: Date;
}
