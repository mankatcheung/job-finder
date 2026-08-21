import type { WorkExperience } from '#src/domain/workExperience/WorkExperience.js';
import type { Education } from '#src/domain/education/Education.js';
import type { Skill } from '#src/domain/skill/Skill.js';
import type { IWorkExperienceRepository } from '#src/use-cases/ports/IWorkExperienceRepository.js';
import type { IEducationRepository } from '#src/use-cases/ports/IEducationRepository.js';
import type { ISkillRepository } from '#src/use-cases/ports/ISkillRepository.js';

/**
 * The user's stored background — work experience, education and skills — as
 * both the records themselves and the prose block that goes into a prompt.
 *
 * Extracted from `GenerateCoverLetterUseCase` and
 * `ComputeResumeMatchScoreUseCase`, which each carried an identical private
 * `buildProfile`; the resume generator would have been a third copy (JEF-199).
 *
 * The records are returned alongside the prose because generating a resume
 * needs to check the model's output against them — prose alone cannot tell you
 * whether an employer the model named is one the user actually entered.
 */
export interface UserProfileRepositories {
  workExperienceRepository: IWorkExperienceRepository;
  educationRepository: IEducationRepository;
  skillRepository: ISkillRepository;
}

export interface UserProfile {
  workExperiences: WorkExperience[];
  educations: Education[];
  skills: Skill[];
}

export async function loadUserProfile(
  deps: UserProfileRepositories,
  userId: string,
): Promise<UserProfile> {
  const [workExperiences, educations, skills] = await Promise.all([
    deps.workExperienceRepository.findAllByUserId(userId),
    deps.educationRepository.findAllByUserId(userId),
    deps.skillRepository.findAllByUserId(userId),
  ]);
  return { workExperiences, educations, skills };
}

export function isUserProfileEmpty(profile: UserProfile): boolean {
  return (
    profile.workExperiences.length === 0 &&
    profile.educations.length === 0 &&
    profile.skills.length === 0
  );
}

/** The prompt-facing rendering. Empty profile → empty string, as before. */
export function formatUserProfile(profile: UserProfile): string {
  const { workExperiences, educations, skills } = profile;
  const lines: string[] = [];

  if (workExperiences.length > 0) {
    lines.push('Work Experience:');
    for (const we of workExperiences) {
      const end = we.endDate ? new Date(we.endDate).toLocaleDateString() : 'Present';
      lines.push(
        `- ${we.title} at ${we.company} (${new Date(we.startDate).toLocaleDateString()} – ${end})`,
      );
      if (we.description) lines.push(`  ${we.description.slice(0, 200)}`);
    }
  }

  if (educations.length > 0) {
    lines.push('\nEducation:');
    for (const edu of educations) {
      const end = edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present';
      lines.push(
        `- ${edu.degree ?? ''} ${edu.field ?? ''} at ${edu.institution} (${new Date(edu.startDate).toLocaleDateString()} – ${end})`,
      );
      if (edu.description) lines.push(`  ${edu.description.slice(0, 200)}`);
    }
  }

  if (skills.length > 0) {
    lines.push('\nSkills:');
    const grouped = skills.reduce(
      (acc, s) => {
        const cat = s.category ?? 'General';
        acc[cat] = acc[cat] || [];
        acc[cat].push(s.proficiency ? `${s.name} (${s.proficiency})` : s.name);
        return acc;
      },
      {} as Record<string, string[]>,
    );
    for (const [cat, names] of Object.entries(grouped)) {
      lines.push(`- ${cat}: ${names.join(', ')}`);
    }
  }

  return lines.join('\n');
}
