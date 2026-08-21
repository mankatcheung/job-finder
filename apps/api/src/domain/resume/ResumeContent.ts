/**
 * A generated resume, before it becomes editor content.
 *
 * Structured rather than prose because a resume *is* its structure — headings,
 * roles, bullets. Flattening it to text and splitting on newlines, the way a
 * cover letter is handled, would throw away the part that matters (JEF-199).
 */
export interface ResumeExperienceEntry {
  company: string;
  title: string;
  period?: string;
  bullets: string[];
}

export interface ResumeEducationEntry {
  institution: string;
  qualification?: string;
  period?: string;
}

export interface ResumeSkillGroup {
  category: string;
  items: string[];
}

export interface ResumeContent {
  summary?: string;
  experience: ResumeExperienceEntry[];
  education: ResumeEducationEntry[];
  skills: ResumeSkillGroup[];
}
