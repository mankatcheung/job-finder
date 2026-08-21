import { describe, it, expect } from 'vitest';
import { resumeToTiptapDoc } from '#src/use-cases/shared/resumeToTiptapDoc.js';

const parse = (json: string) =>
  JSON.parse(json) as { type: string; content: Array<Record<string, unknown>> };

const RESUME = {
  summary: 'Engineer.',
  experience: [
    {
      company: 'Acme',
      title: 'Engineer',
      period: '2020 – 2022',
      bullets: ['Built widgets', 'Shipped things'],
    },
  ],
  education: [{ institution: 'State University', qualification: 'BSc CS', period: '2016 – 2020' }],
  skills: [{ category: 'Languages', items: ['TypeScript', 'Go'] }],
};

describe('resumeToTiptapDoc', () => {
  it('renders headings and bullet lists, not flat paragraphs', () => {
    const doc = parse(resumeToTiptapDoc(RESUME).contentJson);

    const types = doc.content.map((n) => n.type);
    expect(types).toContain('heading');
    expect(types).toContain('bulletList');
  });

  it('puts the role, employer and period in one heading', () => {
    const doc = parse(resumeToTiptapDoc(RESUME).contentJson);
    const headings = doc.content.filter((n) => n.type === 'heading');

    expect(JSON.stringify(headings)).toContain('Engineer — Acme (2020 – 2022)');
  });

  it('writes a bullet per achievement', () => {
    const doc = parse(resumeToTiptapDoc(RESUME).contentJson);
    const list = doc.content.find((n) => n.type === 'bulletList') as { content: unknown[] };

    expect(list.content).toHaveLength(2);
  });

  it('omits a bullet list for a role with no bullets', () => {
    const doc = parse(
      resumeToTiptapDoc({
        ...RESUME,
        experience: [{ company: 'Acme', title: 'Engineer', bullets: [] }],
      }).contentJson,
    );

    expect(doc.content.some((n) => n.type === 'bulletList')).toBe(false);
  });

  it('never emits an empty text node, which the editor rejects on load', () => {
    const doc = resumeToTiptapDoc({
      summary: '',
      experience: [{ company: 'Acme', title: 'Engineer', bullets: ['', '  '] }],
      education: [],
      skills: [],
    });

    expect(doc.contentJson).not.toContain('"text":""');
  });

  it('produces a valid document even when the resume is entirely empty', () => {
    const doc = parse(resumeToTiptapDoc({ experience: [], education: [], skills: [] }).contentJson);

    expect(doc).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });

  it('keeps a plain-text rendering alongside, for search and the match scorer', () => {
    const { plainText } = resumeToTiptapDoc(RESUME);

    expect(plainText).toContain('Built widgets');
    expect(plainText).toContain('State University');
    expect(plainText).toContain('TypeScript');
  });
});
