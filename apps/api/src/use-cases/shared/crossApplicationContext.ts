import type { Note } from '#src/domain/note/Note.js';
import type { DocumentDraft } from '#src/domain/documentDraft/DocumentDraft.js';
import { AI_PROMPT_INPUT } from '#src/constants.js';

/**
 * Opt-in context (JEF-249) drawn from the user's *other* applications —
 * recent notes and cover letter drafts — used to help cover letter
 * generation match the user's voice and avoid repeating the same phrasing
 * across applications.
 *
 * Deliberately anonymized: callers pass only `content`/`plainText`, never
 * company or role, and this formatter never surfaces one. That's the actual
 * safeguard against a Company-A detail leaking into a Company-B letter — the
 * same failure class as JEF-205 one level up, since every application here
 * belongs to the same user. An instruction alone ("don't mention other
 * employers") is easy for a model to slip on if the other employer's name is
 * sitting right there in the prompt; not having the name in the prompt at
 * all is a stronger boundary than reminding the model not to use it.
 */
export function formatCrossApplicationContext(
  notes: Pick<Note, 'content'>[],
  coverLetters: Pick<DocumentDraft, 'plainText'>[],
): string {
  const entries: string[] = [
    ...notes.map((n) => `- (note from a previous application) ${n.content}`),
    ...coverLetters
      .filter((d) => d.plainText.trim().length > 0)
      .map((d) => `- (cover letter written for a previous application) ${d.plainText.trim()}`),
  ];

  if (entries.length === 0) return '';

  const body = entries.join('\n').slice(0, AI_PROMPT_INPUT.CROSS_APPLICATION_CONTEXT_MAX_CHARS);

  return [
    'Notes and cover letters from my other job applications, with the employer deliberately left out — use them only to match my usual voice, tone, and phrasing, and to avoid repeating the same wording again. Do not state or imply anything about another employer, another role, or another application in this letter, even if it seems relevant:',
    '---',
    body,
    '---',
  ].join('\n');
}
