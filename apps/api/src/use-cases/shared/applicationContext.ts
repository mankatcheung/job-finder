import type { Note } from '#src/domain/note/Note.js';
import type { CompanyBriefing } from '#src/domain/companyBriefing/CompanyBriefing.js';
import { AI_PROMPT_INPUT } from '#src/constants.js';

/**
 * What the user has recorded *about this application*, as prompt text.
 *
 * Deliberately not "every column on JobApplication". Most of it is workflow
 * state with nothing to write from, and `salaryRange` must never reach a
 * document the user sends to an employer — a letter that raises compensation
 * unprompted does real damage (JEF-205).
 */
export interface ApplicationContext {
  notes: Note[];
  /** Cover letters only. A resume is about the candidate, not the company. */
  briefing: CompanyBriefing | null;
}

export function formatApplicationContext(context: ApplicationContext): string {
  const sections: string[] = [];

  if (context.notes.length > 0) {
    const body = context.notes
      .map((note) => `- ${note.content}`)
      .join('\n')
      .slice(0, AI_PROMPT_INPUT.APPLICATION_NOTES_MAX_CHARS);
    sections.push(
      [
        'My notes on this application — things I have learned that are not in the job posting. Use them where they help:',
        '---',
        body,
        '---',
      ].join('\n'),
    );
  }

  if (context.briefing) {
    const body = context.briefing.content.slice(0, AI_PROMPT_INPUT.APPLICATION_BRIEFING_MAX_CHARS);
    // Explicitly framed as unverified. The briefing is itself model-generated,
    // and its own prompt acknowledges it may lack reliable knowledge of the
    // company and should hedge rather than guess. Passing it through
    // unlabelled would launder that hedge into a confident claim, in a letter
    // sent to the very company it might be wrong about.
    sections.push(
      [
        `<unverified_company_background generated="${context.briefing.generatedAt.toISOString().slice(0, 10)}">`,
        'Background notes about this company, written by an AI that may be mistaken or out of date. Use them to judge tone and which of my experience to emphasise. Do NOT state anything from here as a fact about the company, and never reference recent events, funding, growth or news.',
        '---',
        body,
        '---',
        '</unverified_company_background>',
      ].join('\n'),
    );
  }

  return sections.join('\n\n');
}
